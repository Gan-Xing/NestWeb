const fs = require("fs").promises;

async function generatePackageFiles() {
  try {
    // 读取当前的 package.json
    const packageJson = require("./package.json");

    // 创建 package.json 的深拷贝
    const packageDev = JSON.parse(JSON.stringify(packageJson));

    // 再次创建 package.json 的深拷贝，并修改 @ganxing/utils 的版本
    const packageTurbodev = JSON.parse(JSON.stringify(packageJson));
    packageTurbodev.dependencies["@ganxing/utils"] = "workspace:^";
     packageTurbodev.dependencies["@ganxing/wechat"] = "workspace:^";
    delete packageTurbodev.devDependencies;

    // 异步写入到文件
    await fs.writeFile("packageturbodev.json", JSON.stringify(packageTurbodev, null, 2));
    await fs.writeFile("packagedev.json", JSON.stringify(packageDev, null, 2));
  } catch (error) {
    console.error("Error occurred:", error);
    process.exit(1); // 发生错误时退出脚本
  }
}

generatePackageFiles();
