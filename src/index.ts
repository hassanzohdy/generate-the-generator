import { rootPath } from "@mongez/node";
import ComponentGenerator, { StyleMode } from "./generators/ComponentGenerator";

const componentGenerator = new ComponentGenerator("home");

componentGenerator
  .saveTo(rootPath("build/components"))
  .styleMode(StyleMode.all)
  .withStoryBook(true)
  .withTypes(true)
  .withTests(true)
  .withDefaultProps({
    name: "Hasan",
  })
  .generate();
