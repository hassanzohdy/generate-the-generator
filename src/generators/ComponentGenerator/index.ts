import { exists, makeDirectory } from "@mongez/fs";
import { toStudlyCase } from "@mongez/reinforcements";
import File from "app/utils/File";
import chalk from "chalk";
import path from "path";
import { StyleMode } from "./types";
export * from "./types";

export default class ComponentGenerator {
  /**
   * Save component path
   */
  public targetPath = "";

  /**
   * Generator Description
   */
  public description = `Generate a new React component`;

  /**
   * Generator label
   */
  public label = "React Component";

  /**
   * Full target path
   */
  private fullTargetPath = "";

  /**
   * Style mode
   */
  private _styleMode: StyleMode = StyleMode.none;

  /**
   * Generate story book
   */
  private _withStoryBook = false;

  /**
   * Generate test files
   */
  private _withTests = false;

  /**
   * Generate default props object
   */
  private _withDefaultProps: false | Record<string, any> = false;

  /**
   * Generate types for the component
   */
  private _withTypes = false;

  /**
   * Constructor
   */
  public constructor(private componentName: string) {}

  /**
   * Set the component save path
   */
  public saveTo(saveTo: string) {
    this.targetPath = saveTo;

    return this;
  }

  /**
   * Set style mode
   */
  public styleMode(styleMode: StyleMode) {
    this._styleMode = styleMode;
    return this;
  }

  /**
   * Determine whether to generate story book file
   */
  public withStoryBook(withStoryBook: boolean) {
    this._withStoryBook = withStoryBook;

    return this;
  }

  /**
   * Determine whether to generate component types
   */
  public withTypes(withTypes: boolean) {
    this._withTypes = withTypes;

    return this;
  }

  /**
   * Determine whether to generate test file
   */
  public withTests(withTests: boolean) {
    this._withTests = withTests;

    return this;
  }

  /**
   * Determine whether to generate default props object in the component file
   */
  public withDefaultProps(withDefaultProps: any) {
    this._withDefaultProps = withDefaultProps;

    return this;
  }

  /**
   * Generate the component
   */
  public generate() {
    this.prepareComponentName();

    // prepare component path and create the component directory
    if (!this.prepareComponentPath()) return false;

    // now lets move the file and replace the content
    this.copyFiles();
  }

  /**
   * Prepare component name
   */
  private prepareComponentName() {
    // component name must be in pascal case
    this.componentName = toStudlyCase(this.componentName); // my-home > MyHome
  }

  /**
   * Prepare component path
   */
  private prepareComponentPath() {
    // the component path must be in kebab case
    this.fullTargetPath = path.resolve(this.targetPath, this.componentName);

    if (exists(this.fullTargetPath)) {
      console.log(
        `Component ${chalk.cyan(
          this.componentName,
        )} already exists in ${chalk.yellow(this.targetPath)}`,
      );

      return false;
    }

    makeDirectory(this.fullTargetPath);

    return true;
  }

  /**
   * Copy component files
   */
  private copyFiles() {
    this.copyIndexFile();
    this.copyComponentFile();
    this.copyTypesFile();

    if (this.styleModeIs(StyleMode.styled)) {
      this.copyStyledFile();
    }

    if (this.styleModeIs(StyleMode.scss)) {
      this.copyScssFile();
    }

    if (this._withStoryBook) {
      this.copyStoryBookFile();
    }

    if (this._withTests) {
      this.copyTestFile();
    }
  }

  /**
   * Copy story book file
   */
  private copyStoryBookFile() {
    const storyBookFile = new File(this.stubFile("component.storybook.tsx"));

    storyBookFile
      .replace("{{ Component }}", this.componentName)
      .saveTo(this.outputPath(this.componentName + ".storybook.tsx"));
  }

  /**
   * Copy test file
   */
  private copyTestFile() {
    const testFile = new File(this.stubFile("component.test.tsx"));

    testFile
      .replace("{{ Component }}", this.componentName)
      .saveTo(this.outputPath(this.componentName + ".test.tsx"));
  }

  /**
   * Check if the given style mode is the current style mode
   */
  public styleModeIs(styleMode: StyleMode) {
    if (this._styleMode === StyleMode.none) return false;
    return this._styleMode === StyleMode.all || this._styleMode === styleMode;
  }

  /**
   * Copy the index file
   */
  private copyIndexFile() {
    const indexFile = new File(this.stubFile("index.ts"));

    indexFile
      .replace("// {{ imports }}", this.getIndexImports())
      .saveTo(this.outputPath("index.ts"));
  }

  /**
   * Get index imports
   */
  private getIndexImports() {
    const imports = [];
    imports.push(`export { default } from "./${this.componentName}";`);

    if (this._withTypes) {
      imports.push(`export * from "./${this.componentName}.types";`);
    }

    return imports.join("\n") + "\n";
  }

  /**
   * Copy component file
   */
  private copyComponentFile() {
    const componentFile = new File(this.stubFile("component.tsx"));

    componentFile
      .replace("{{ Component }}", this.componentName)
      .replace("{{ imports }}", this.getImports())
      .replace("{{ defaultProps }}", this.getDefaultProps())
      .replace("{{ ComponentPropsTypes }}", this.getComponentPropsTypes())
      .saveTo(this.outputPath(this.componentName + ".tsx"));
  }

  /**
   * Get component props types
   */
  private getComponentPropsTypes() {
    if (!this._withTypes) return "any";

    return `${this.componentName}Props`;
  }

  /**
   * Get default props content
   */
  private getDefaultProps() {
    if (!this._withDefaultProps) return "";

    // convert the object to string
    const defaultProps: any[] = [];

    for (const key in this._withDefaultProps) {
      let value = this._withDefaultProps[key];

      if (typeof value === "string") {
        value = `"${value}"`;
      }

      defaultProps.push(`${key}: ${value},`);
    }

    return `\n\n${this.componentName}.defaultProps = {
  // your default props here
  ${defaultProps.join("\n  ")}
};\n`;
  }

  /**
   * Get component imports
   */
  private getImports() {
    // import the component types
    const imports = [];

    if (this._withTypes) {
      imports.push(
        `import { ${this.componentName}Props } from "./${this.componentName}.types";`,
      );
    }

    if (this.styleModeIs(StyleMode.scss)) {
      imports.push(
        `import classes from "./${this.componentName}.module.scss";`,
      );
    }

    if (this.styleModeIs(StyleMode.styled)) {
      imports.push(
        `import { ${this.componentName}Wrapper } from "./${this.componentName}.styled";`,
      );
    }

    return imports.join("\n") + (imports.length > 0 ? "\n\n" : "");
  }

  /**
   * Copy types file
   */
  private copyTypesFile() {
    if (!this._withTypes) return;

    const typesFile = new File(this.stubFile("types.ts"));

    typesFile
      .replace("{{ Component }}", this.componentName)
      .saveTo(this.outputPath(this.componentName + ".types.ts"));
  }

  /**
   * Copy styled file
   */
  private copyStyledFile() {
    const styledFile = new File(this.stubFile("component.styled.tsx"));

    styledFile
      .replace("{{ ComponentWrapper }}", this.componentName + "Wrapper")
      .saveTo(this.outputPath(this.componentName + ".styled.ts"));
  }

  /**
   * Copy scss file
   */
  private copyScssFile() {
    const scssFile = new File(this.stubFile("component.module.scss"));

    scssFile
      .replace("{{ ComponentWrapper }}", this.componentName + "Wrapper")
      .saveTo(this.outputPath(this.componentName + ".scss"));
  }

  /**
   * Get the location of the given stub file
   */
  private stubFile(fileName: string) {
    return path.resolve(__dirname, "stubs", fileName);
  }

  /**
   * Get the output path
   */
  private outputPath(fileName: string) {
    return path.resolve(this.fullTargetPath, fileName);
  }
}
