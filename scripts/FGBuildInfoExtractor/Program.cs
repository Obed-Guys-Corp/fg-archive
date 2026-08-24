using AssetsTools.NET;
using AssetsTools.NET.Extra;
using System.Text;
using System.Text.Json;

namespace FGBuildInfoExtractor;

internal static class Program
{
    private static int Main(string[] args)
    {
        if (args.Length != 1 || !Directory.Exists(args[0]))
        {
            Console.Error.WriteLine("Usage: FGBuildInfoExtractor [Path to FGBuild]");
            return 1;
        }

        var buildPath = Path.GetFullPath(args[0]);
        var extractor = new BuildInfoExtractor(buildPath);

        return extractor.Run();
    }
}

internal sealed class BuildInfoExtractor
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true
    };

    private readonly string _buildPath;
    private readonly string _dataPath;
    private readonly string _bundlesPath;

    public BuildInfoExtractor(string buildPath)
    {
        _buildPath = buildPath;
        _dataPath = Path.Combine(buildPath, "FallGuys_client_game_Data");
        _bundlesPath = Path.Combine(_dataPath, "StreamingAssets", "aa~", "StandaloneWindows64");
    }

    public int Run()
    {
        Console.Error.WriteLine($"FGBuild: {_buildPath}");
        if (!Directory.Exists(_dataPath))
        {
            Console.Error.WriteLine($"Can't find game data path: {_dataPath}");
            return 1;
        }

        // New builds store BuildInfo in bundles, old builds store it in asset files
        var buildInfo = FindInBundles() ?? FindInStandaloneAssets();
        if (buildInfo is null)
        {
            Console.Error.WriteLine("BuildInfo was not found in the supplied game files");
            return 2;
        }

        PrintBuildInfo(buildInfo);

        return 0;
    }

    private BuildInfo? FindInBundles()
    {
        if (!Directory.Exists(_bundlesPath)) return null;

        foreach (var bundlePath in Directory.EnumerateFiles(_bundlesPath, "*.bundle", SearchOption.AllDirectories))
        {
            try
            {
                var buildInfo = ReadBundle(bundlePath);
                if (buildInfo is not null) return buildInfo;
            }
            catch (Exception exception)
            {
                Console.Error.WriteLine($"Skipped {bundlePath}: {exception.Message}");
            }
        }

        return null;
    }

    private BuildInfo? FindInStandaloneAssets()
    {
        var assetPaths = Directory.EnumerateFiles(_dataPath, "*.assets", SearchOption.TopDirectoryOnly).Where(IsStandaloneAsset).OrderBy(GetStandaloneAssetPriority);

        foreach (var assetPath in assetPaths)
        {
            try
            {
                var buildInfo = ReadStandaloneAsset(assetPath);
                if (buildInfo is not null) return buildInfo;
            }
            catch (Exception exception)
            {
                Console.Error.WriteLine($"Skipped {assetPath}: {exception.Message}");
            }
        }

        return null;
    }

    private static bool IsStandaloneAsset(string path)
    {
        var name = Path.GetFileName(path);
        return name.Equals("resources.assets", StringComparison.OrdinalIgnoreCase) || name.Equals("globalgamemanagers.assets", StringComparison.OrdinalIgnoreCase) || name.StartsWith("sharedassets", StringComparison.OrdinalIgnoreCase);
    }

    private static int GetStandaloneAssetPriority(string path)
    {
        var name = Path.GetFileName(path);
        if (name.Equals("sharedassets0.assets", StringComparison.OrdinalIgnoreCase)) return 0;
        if (name.StartsWith("sharedassets", StringComparison.OrdinalIgnoreCase)) return 1;
        if (name.Equals("resources.assets", StringComparison.OrdinalIgnoreCase)) return 2;
        return 3;
    }

    private static BuildInfo? ReadStandaloneAsset(string assetPath)
    {
        var manager = new AssetsManager();
        var assetsFile = manager.LoadAssetsFile(assetPath, loadDeps: false);

        try
        {
            if (assetsFile.file.Metadata.TypeTreeEnabled)
            {
                var buildInfo = ReadAssetContents(manager, assetsFile);
                if (buildInfo is not null) return buildInfo;
            }

            // Old asset files may have no field info, so read their raw data
            return ReadLegacyAssetContents(assetsFile, assetPath);
        }
        finally
        {
            manager.UnloadAssetsFile(assetsFile);
        }
    }

    private static BuildInfo? ReadBundle(string bundlePath)
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
                if (assetsFile is null) continue;

                try
                {
                    var buildInfo = ReadAssetContents(manager, assetsFile);
                    if (buildInfo is not null) return buildInfo;
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

    private static BuildInfo? ReadAssetContents(AssetsManager manager, AssetsFileInstance assetsFile)
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

            return new BuildInfo(buildNumber, commit, ReadString(asset, "buildDate"));
        }

        return null;
    }

    private static BuildInfo? ReadLegacyAssetContents(AssetsFileInstance assetsFile, string assetPath)
    {
        using var stream = File.OpenRead(assetPath);

        foreach (var info in assetsFile.file.GetAssetsOfType(AssetClassID.MonoBehaviour))
        {
            var bytes = new byte[info.ByteSize];
            stream.Position = info.GetAbsoluteByteOffset(assetsFile.file);
            stream.ReadExactly(bytes);

            var buildInfo = ReadLegacyBuildInfo(bytes);
            if (buildInfo is not null) return buildInfo;
        }

        return null;
    }

    private static BuildInfo? ReadLegacyBuildInfo(byte[] bytes)
    {
        // BuildInfo stores its name, commit and build number as aligned strings
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

    private static bool TryReadUnityString(byte[] bytes, ref int offset, out string value)
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

    private static bool IsCommit(string value)
    {
        return value.Length is >= 7 and <= 40 && value.All(char.IsAsciiHexDigit);
    }

    private static bool HasField(AssetTypeValueField asset, string name)
    {
        return asset.Children.Any(child => child.FieldName == name);
    }

    private static string ReadString(AssetTypeValueField asset, string name)
    {
        return asset.Children.FirstOrDefault(child => child.FieldName == name)?.AsString ?? string.Empty;
    }

    private static void PrintBuildInfo(BuildInfo buildInfo)
    {
        Console.WriteLine(JsonSerializer.Serialize(buildInfo, JsonOptions));
    }
}

internal sealed record BuildInfo(int BuildNumber, string BuildCommit, string BuildDate);
