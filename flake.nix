{ 
  description = "FG Archive dev shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = {
    nixpkgs,
    ...
  }:
  let 
    supportedSystems = [
      "x86_64-linux"
    ];

    forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
      pkgs = import nixpkgs {
        inherit system;
      };
    });
  in {
    devShells = forEachSupportedSystem ({ pkgs }: 
    {
      default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs
          dotnet-sdk_10
        ];
      };
    });
  };
}
