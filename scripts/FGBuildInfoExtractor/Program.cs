using LibCpp2IL.Logging;

namespace FGBuildInfoExtractor;

internal static class Program
{
    private static int Main(string[] args)
    {
        if (!File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "lz4.tpk")))
        {
            Console.Error.WriteLine("No lz4.tpk file found, get it here https://github.com/AssetRipper/Tpk/blob/master/README.md");
            return 1;
        }

        if (args.Length != 1 || !Directory.Exists(args[0]))
        {
            Console.Error.WriteLine("Usage: FGBuildInfoExtractor [Path to FGBuild]");
            return 1;
        }

        LibLogger.ShowVerbose = false;

        var buildPath = Path.GetFullPath(args[0]);
        var extractor = new InfoExtractor(buildPath);

        return extractor.Run();
    }
}
