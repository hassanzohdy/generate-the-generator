import { getFile, getJson, putFile } from "@mongez/fs";

export default class File {
  /**
   * File contents
   */
  public contents = "";

  /**
   * Constructor
   */
  public constructor(public filePath: string) {
    this.load();
  }

  /**
   * Load file contents
   */
  public load() {
    this.contents = getFile(this.filePath);

    return this;
  }

  /**
   * Load as json content
   */
  public loadAsJson() {
    this.contents = getJson(this.filePath);

    return this;
  }

  /**
   * Replace the given string with the given replacement
   */
  public replace(search: string | RegExp, replacement: string) {
    this.contents = this.contents.replace(
      typeof search === "string" ? new RegExp(search, "g") : search,
      replacement,
    );

    return this;
  }

  /**
   * Save to the given path
   */
  public saveTo(saveTo: string) {
    putFile(saveTo, this.contents);

    return this;
  }
}
