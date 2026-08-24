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
        var extractor = new InfoExtractor(buildPath);

        return extractor.Run();
    }
}
