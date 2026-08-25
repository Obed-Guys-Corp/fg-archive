using AssetsTools.NET;
using AssetsTools.NET.Cpp2IL;
using AssetsTools.NET.Extra;
using System.Text;
using System.Text.Json;

internal sealed class InfoExtractor
{
    internal sealed record BuildInfo(string Version, int BuildNumber, string BuildCommit, string BuildDate, string Env, string Signature);
    internal sealed record ExtractedBuildInfo(int BuildNumber, string BuildCommit, string BuildDate);
    internal sealed record ClientServer(string Address, int Port);
    internal sealed record BuildEnvironment(ClientServer GatewayServer, ClientServer LoginServer, ClientServer AnalyticsServer, string Signature);
    internal sealed record EnvironmentSelection(string Name, string Signature);
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
    readonly string _globalGameManagersPath;
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
        _globalGameManagersPath = Path.Combine(_dataPath, "globalgamemanagers");
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

        var buildInfo = FindBuildInfo();

        Console.WriteLine("\n\n");

        if (_envs.Count > 0)
            Console.WriteLine(JsonSerializer.Serialize(_envs, JsonOptions));
        else
            Console.WriteLine($"No envs found");

        Console.WriteLine("");

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

    BuildInfo? FindBuildInfo()
    {
        var version = FindApplicationVersion();
        var extractedBuildInfo = FindInBundles() ?? FindInStandaloneAssets();
        if (extractedBuildInfo == null) return null;

        var environment = SelectEnvironment();
        return new(
            version,
            extractedBuildInfo.BuildNumber,
            extractedBuildInfo.BuildCommit,
            extractedBuildInfo.BuildDate,
            environment.Name,
            environment.Signature);
    }

    EnvironmentSelection SelectEnvironment()
    {
        foreach (var (name, environment) in _envs)
            return new(name, environment.Signature);

        return new(string.Empty, string.Empty);
    }

    string FindApplicationVersion()
    {
        Console.WriteLine("Looking for Unity application version...");

        var assetPaths = new[]
        {
            _globalGameManagersPath,
            $"{_globalGameManagersPath}.assets"
        };

        foreach (var assetPath in assetPaths)
        {
            if (!File.Exists(assetPath)) continue;

            try
            {
                var version = ReadApplicationVersion(assetPath);
                if (version.Length == 0) continue;

                Console.WriteLine($"Found Unity application version in: {assetPath}");
                return version;
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"Skipped {assetPath}: {e.Message}");
            }
        }

        Console.Error.WriteLine("No Unity application version found");
        return string.Empty;
    }

    string ReadApplicationVersion(string assetPath)
    {
        var assetsFile = _manager.LoadAssetsFile(assetPath);

        try
        {
            foreach (var info in assetsFile.file.GetAssetsOfType(AssetClassID.PlayerSettings))
            {
                AssetTypeValueField asset;

                try
                {
                    asset = _manager.GetBaseField(assetsFile, info);
                }
                catch (Exception)
                {
                    continue;
                }

                var version = ReadFirstString(asset, "m_BundleVersion", "bundleVersion");
                if (version.Length > 0) return version;
            }
        }
        finally
        {
            _manager.UnloadAssetsFile(assetsFile);
        }

        return string.Empty;
    }

    ExtractedBuildInfo? FindInBundles()
    {
        if (!Directory.Exists(_bundlesPath)) return null;

        foreach (var bundlePath in Directory.EnumerateFiles(_bundlesPath, "*.bundle", SearchOption.AllDirectories))
        {
            try
            {
                var extractedBuildInfo = ReadBundle(bundlePath);
                if (extractedBuildInfo != null) return extractedBuildInfo;
            }
            catch (Exception e)
            {
                Console.Error.WriteLine($"Skipped {bundlePath}: {e.Message}");
            }
        }

        return null;
    }

    ExtractedBuildInfo? FindInStandaloneAssets()
    {
        var assetPaths = Directory.EnumerateFiles(_dataPath!, "*.assets", SearchOption.TopDirectoryOnly).Where(IsStandaloneAsset).OrderBy(GetStandaloneAssetPriority);

        foreach (var assetPath in assetPaths)
        {
            try
            {
                var extractedBuildInfo = ReadStandaloneAsset(assetPath);
                if (extractedBuildInfo != null) return extractedBuildInfo;
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

    ExtractedBuildInfo? ReadStandaloneAsset(string assetPath)
    {
        var assetsFile = _manager.LoadAssetsFile(assetPath);

        try
        {
            if (assetsFile.file.Metadata.TypeTreeEnabled)
            {
                var extractedBuildInfo = ReadAssetContents(_manager, assetsFile);
                if (extractedBuildInfo != null) return extractedBuildInfo;
            }

            // Old asset files may have no field info, so read their raw data
            return ReadLegacyAssetContents(assetsFile, assetPath);
        }
        finally
        {
            _manager.UnloadAssetsFile(assetsFile);
        }
    }

    ExtractedBuildInfo? ReadBundle(string bundlePath)
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
                    var extractedBuildInfo = ReadAssetContents(_manager, assetsFile);
                    if (extractedBuildInfo != null) return extractedBuildInfo;
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

    static ExtractedBuildInfo? ReadAssetContents(AssetsManager manager, AssetsFileInstance assetsFile)
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

            Console.WriteLine($"Found Build Info in: {assetsFile.path}");
            return new ExtractedBuildInfo(buildNumber, commit, ReadString(asset, "buildDate"));
        }

        return null;
    }

    static ExtractedBuildInfo? ReadLegacyAssetContents(AssetsFileInstance assetsFile, string assetPath)
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

    static ExtractedBuildInfo? ReadLegacyBuildInfo(byte[] bytes)
    {
        for (var offset = 0; offset <= bytes.Length - 12; offset += 4)
        {
            var position = offset;

            if (!TryReadUnityString(bytes, ref position, out var name) || name != "BuildInfo") continue;
            if (!TryReadUnityString(bytes, ref position, out var commit) || !IsCommit(commit)) continue;
            if (!TryReadUnityString(bytes, ref position, out var buildNumberText) || !int.TryParse(buildNumberText, out var buildNumber)) continue;

            return new ExtractedBuildInfo(buildNumber, commit, string.Empty);
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
    static string ReadFirstString(AssetTypeValueField asset, params string[] names) => names.Select(name => ReadString(asset, name)).FirstOrDefault(value => value.Length > 0) ?? string.Empty;
}
