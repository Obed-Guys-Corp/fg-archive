using AssetsTools.NET;
using AssetsTools.NET.Cpp2IL;
using AssetsTools.NET.Extra;
using System.Text;
using System.Text.Json;

internal sealed class InfoExtractor
{
    internal sealed record BuildInfo(int BuildNumber, string BuildCommit, string BuildDate);
    internal sealed record ClientServer(string Address, int Port);
    internal sealed record BuildEnvironment(ClientServer GatewayServer, ClientServer LoginServer, ClientServer AnalyticsServer, string Signature);
    readonly string[] _knownEnvs = 
    [
        "Production",
        "OpenBeta",
        "ClosedBeta",
        "Unstable",
        "China",
        "CompatQA",
        "ComplianceQA",
        "Development",
        "ExternalQA",
        "InternalQA",
        "LoadTesting",
        "Mobile",
        "MobileQA",
        "Porting",
        "Staging"
    ];
    static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        WriteIndented = true
    };

    readonly string _buildPath;
    readonly string? _dataPath;
    readonly string _bundlesPath;
    readonly string _resourcesPath;
    readonly AssetsManager _manager;
    readonly Dictionary<string, BuildEnvironment> _envs;

    public InfoExtractor(string buildPath)
    {
        _manager = new();

        _envs = [];
        _buildPath = buildPath;

        if (!Directory.Exists(_buildPath)) throw new DirectoryNotFoundException(buildPath);

        _dataPath = Directory.GetDirectories(_buildPath).FirstOrDefault(x => Path.GetFileName(x)!.EndsWith("_Data"));

        if (!Directory.Exists(_dataPath)) throw new DirectoryNotFoundException(_dataPath);

        _resourcesPath = Path.Combine(_dataPath, "resources.assets");
        _bundlesPath = Path.Combine(_dataPath, "StreamingAssets", "aa~", "StandaloneWindows64");

        _manager.LoadClassPackage("lz4.tpk");

        var il2cpp = FindCpp2IlFiles.Find(_dataPath);

        if (il2cpp.success)
        {
            _manager.MonoTempGenerator = new Cpp2IlTempGenerator(il2cpp.metaPath, il2cpp.asmPath);
        }
        else
        {
            var managedPath = Path.Combine(_dataPath, "Managed");
            _manager.MonoTempGenerator = new MonoCecilTempGenerator(managedPath);
        }
    }

    public int Run()
    {
        Console.WriteLine($"Working with: {_buildPath}");

        if (!Directory.Exists(_dataPath))
        {
            Console.Error.WriteLine($"Can't find game data path: {_dataPath}");
            return 1;
        }

        LookForBuildEnvs();

        var buildInfo = FindInBundles() ?? FindInStandaloneAssets();

        Console.WriteLine("\n\n");

        if (_envs.Count > 0)
            Console.WriteLine(JsonSerializer.Serialize(_envs, JsonOptions));
        else
            Console.WriteLine($"No envs found");

        if (buildInfo != null)
            Console.WriteLine(JsonSerializer.Serialize(buildInfo, JsonOptions));
        else
            Console.WriteLine($"No build info found");

        return 0;
    }

    void LookForBuildEnvs()
    {
        Console.WriteLine("Looking for build envs...");

        var asset = _manager.LoadAssetsFile(_resourcesPath);

        _manager.LoadClassDatabaseFromPackage(asset.file.Metadata.UnityVersion);

        foreach (var info in asset.file.GetAssetsOfType(AssetClassID.MonoBehaviour))
        {
            try
            {
                var baseField = _manager.GetBaseField(asset, info);
                var name = baseField["m_Name"].AsString;

                if (!_knownEnvs.Contains(name)) continue;

                var loginServ = ResolveServer(baseField, "LoginServer");
                var gatewayServ = ResolveServer(baseField, "GatewayServer");
                var analyticsServ = ResolveServer(baseField, "AnalyticsServer");
                var sign = baseField["ClientVersionSignature"].AsString;

                _envs.Add(name, new(gatewayServ, loginServ, analyticsServ, sign));
            }
            catch
            {
                
            }
        }
    }

    static ClientServer ResolveServer(AssetTypeValueField field, string serv)
    {
        var sField = field[serv];
        if (sField == null) return new(null, 0);

        return new(sField["Address"]?.AsString, sField["Port"].AsInt);
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

    BuildInfo? ReadStandaloneAsset(string assetPath)
    {
        var assetsFile = _manager.LoadAssetsFile(assetPath);

        try
        {
            if (assetsFile.file.Metadata.TypeTreeEnabled)
            {
                var buildInfo = ReadAssetContents(_manager, assetsFile);
                if (buildInfo != null) return buildInfo;
            }

            // Old asset files may have no field info, so read their raw data
            return ReadLegacyAssetContents(assetsFile, assetPath);
        }
        finally
        {
            _manager.UnloadAssetsFile(assetsFile);
        }
    }

    BuildInfo? ReadBundle(string bundlePath)
    {
        var bundle = _manager.LoadBundleFile(bundlePath, unpackIfPacked: true);

        try
        {
            var entries = bundle.file.BlockAndDirInfo.DirectoryInfos;

            for (var index = 0; index < entries.Count; index++)
            {
                if (!bundle.file.IsAssetsFile(index)) continue;

                var assetsFile = _manager.LoadAssetsFileFromBundle(bundle, index, loadDeps: false);
                if (assetsFile == null) continue;

                try
                {
                    var buildInfo = ReadAssetContents(_manager, assetsFile);
                    if (buildInfo != null) return buildInfo;
                }
                finally
                {
                    _manager.UnloadAssetsFile(assetsFile);
                }
            }
        }
        finally
        {
            _manager.UnloadBundleFile(bundle);
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

            if (buildInfo != null)
            {
                Console.WriteLine($"Found in: {assetsFile.path}");
                return buildInfo;
            }
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