using AssetsTools.NET;
using AssetsTools.NET.Extra;
using System.Text;
using System.Text.Json;

internal sealed class InfoExtractor
{
    internal sealed record BuildInfo(int BuildNumber, string BuildCommit, string BuildDate);
    static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true
    };

    readonly string _buildPath;
    readonly string? _dataPath;
    readonly string _bundlesPath;

    public InfoExtractor(string buildPath)
    {
        _buildPath = buildPath;

        if (!Directory.Exists(_buildPath)) throw new DirectoryNotFoundException(buildPath);

        _dataPath = Directory.GetDirectories(_buildPath).FirstOrDefault(x => Path.GetFileName(x)!.EndsWith("_Data"));

        if (!Directory.Exists(_dataPath)) throw new DirectoryNotFoundException(_dataPath);

        _bundlesPath = Path.Combine(_dataPath, "StreamingAssets", "aa~", "StandaloneWindows64");
    }

    public int Run()
    {
        Console.WriteLine($"FGBuild: {_buildPath}");

        if (!Directory.Exists(_dataPath))
        {
            Console.Error.WriteLine($"Can't find game data path: {_dataPath}");
            return 1;
        }

        var buildInfo = FindInBundles() ?? FindInStandaloneAssets();
        if (buildInfo == null)
        {
            Console.Error.WriteLine("BuildInfo was not found in the supplied game files");
            return 2;
        }

        Console.WriteLine(JsonSerializer.Serialize(buildInfo, JsonOptions));

        return 0;
    }

    BuildInfo? FindInBundles()
    {
        if (!Directory.Exists(_bundlesPath)) return null;

        foreach (var bundlePath in Directory.EnumerateFiles(_bundlesPath, "*.bundle", SearchOption.AllDirectories))
        {
            try
            {
                var buildInfo = ReadBundle(bundlePath);
                if (buildInfo != null) return buildInfo;
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"Skipped {bundlePath}: {e.Message}");
            }
        }

        return null;
    }

    BuildInfo? FindInStandaloneAssets()
    {
        var assetPaths = Directory.EnumerateFiles(_dataPath!, "*.assets", SearchOption.TopDirectoryOnly).Where(IsStandaloneAsset).OrderBy(GetStandaloneAssetPriority);

        foreach (var assetPath in assetPaths)
        {
            try
            {
                var buildInfo = ReadStandaloneAsset(assetPath);
                if (buildInfo != null) return buildInfo;
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"Skipped {assetPath}: {e.Message}");
            }
        }

        return null;
    }

    static bool IsStandaloneAsset(string path)
    {
        var name = Path.GetFileName(path);
        return name.Equals("resources.assets", StringComparison.OrdinalIgnoreCase) || name.Equals("globalgamemanagers.assets", StringComparison.OrdinalIgnoreCase) || name.StartsWith("sharedassets", StringComparison.OrdinalIgnoreCase);
    }

    static int GetStandaloneAssetPriority(string path)
    {
        var name = Path.GetFileName(path);

        if (name.Equals("sharedassets0.assets", StringComparison.OrdinalIgnoreCase)) return 0;
        if (name.StartsWith("sharedassets", StringComparison.OrdinalIgnoreCase)) return 1;
        if (name.Equals("resources.assets", StringComparison.OrdinalIgnoreCase)) return 2;

        return 3;
    }

    static BuildInfo? ReadStandaloneAsset(string assetPath)
    {
        var manager = new AssetsManager();
        var assetsFile = manager.LoadAssetsFile(assetPath);

        try
        {
            if (assetsFile.file.Metadata.TypeTreeEnabled)
            {
                var buildInfo = ReadAssetContents(manager, assetsFile);
                if (buildInfo != null) return buildInfo;
            }

            // Old asset files may have no field info, so read their raw data
            return ReadLegacyAssetContents(assetsFile, assetPath);
        }
        finally
        {
            manager.UnloadAssetsFile(assetsFile);
        }
    }

    static BuildInfo? ReadBundle(string bundlePath)
    {
        var manager = new AssetsManager();
        var bundle = manager.LoadBundleFile(bundlePath, unpackIfPacked: true);

        try
        {
            var entries = bundle.file.BlockAndDirInfo.DirectoryInfos;

            for (var index = 0; index < entries.Count; index++)
            {
                if (!bundle.file.IsAssetsFile(index)) continue;

                var assetsFile = manager.LoadAssetsFileFromBundle(bundle, index, loadDeps: false);
                if (assetsFile == null) continue;

                try
                {
                    var buildInfo = ReadAssetContents(manager, assetsFile);
                    if (buildInfo != null) return buildInfo;
                }
                finally
                {
                    manager.UnloadAssetsFile(assetsFile);
                }
            }
        }
        finally
        {
            manager.UnloadBundleFile(bundle);
        }

        return null;
    }

    static BuildInfo? ReadAssetContents(AssetsManager manager, AssetsFileInstance assetsFile)
    {
        foreach (var info in assetsFile.file.GetAssetsOfType(AssetClassID.MonoBehaviour))
        {
            AssetTypeValueField asset;

            try
            {
                asset = manager.GetBaseField(assetsFile, info);
            }
            catch (Exception)
            {
                continue;
            }

            if (!HasField(asset, "commit") || !HasField(asset, "buildNumber")) continue;

            var commit = ReadString(asset, "commit");
            if (!IsCommit(commit)) continue;

            if (!int.TryParse(ReadString(asset, "buildNumber"), out var buildNumber)) continue;

            Console.WriteLine($"Found in: {assetsFile.path}");
            return new BuildInfo(buildNumber, commit, ReadString(asset, "buildDate"));
        }

        return null;
    }

    static BuildInfo? ReadLegacyAssetContents(AssetsFileInstance assetsFile, string assetPath)
    {
        using var stream = File.OpenRead(assetPath);

        foreach (var info in assetsFile.file.GetAssetsOfType(AssetClassID.MonoBehaviour))
        {
            var bytes = new byte[info.ByteSize];

            stream.Position = info.GetAbsoluteByteOffset(assetsFile.file);
            stream.ReadExactly(bytes);

            var buildInfo = ReadLegacyBuildInfo(bytes);

            Console.WriteLine($"Found in: {assetsFile.path}");
            if (buildInfo != null) return buildInfo;
        }

        return null;
    }

    static BuildInfo? ReadLegacyBuildInfo(byte[] bytes)
    {
        for (var offset = 0; offset <= bytes.Length - 12; offset += 4)
        {
            var position = offset;

            if (!TryReadUnityString(bytes, ref position, out var name) || name != "BuildInfo") continue;
            if (!TryReadUnityString(bytes, ref position, out var commit) || !IsCommit(commit)) continue;
            if (!TryReadUnityString(bytes, ref position, out var buildNumberText) || !int.TryParse(buildNumberText, out var buildNumber)) continue;

            return new BuildInfo(buildNumber, commit, string.Empty);
        }

        return null;
    }

    static bool TryReadUnityString(byte[] bytes, ref int offset, out string value)
    {
        value = string.Empty;
        if (offset > bytes.Length - 4) return false;

        var length = BitConverter.ToInt32(bytes, offset);
        offset += 4;

        if (length < 0 || length > bytes.Length - offset) return false;

        value = Encoding.UTF8.GetString(bytes, offset, length);
        offset += length;
        offset = (offset + 3) & ~3;

        return offset <= bytes.Length;
    }

    static bool IsCommit(string value) => value.Length is >= 7 and <= 40 && value.All(char.IsAsciiHexDigit);
    static bool HasField(AssetTypeValueField asset, string name) => asset.Children.Any(child => child.FieldName == name);
    static string ReadString(AssetTypeValueField asset, string name) => asset.Children.FirstOrDefault(child => child.FieldName == name)?.AsString ?? string.Empty;
}