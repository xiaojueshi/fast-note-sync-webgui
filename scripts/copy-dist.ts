import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILE = path.resolve(__dirname, "../.env");

// 加载 .env 环境变量
if (fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, "utf-8");
    envContent.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2"); // 去除引号
                if (!process.env[key]) process.env[key] = value;
            }
        }
    });
}

async function main() {
    const args = process.argv.slice(2);
    const targetKey = args[0];

    if (!targetKey) {
        console.error('Please specify a target (e.g., win, mac)');
        process.exit(1);
    }

    const targetPath = targetKey === 'win' ? process.env.DIST_PATH_WIN : process.env.DIST_PATH_MAC;

    if (!targetPath) {
        console.error(`Target path for "${targetKey}" not found in environment variables (DIST_PATH_WIN/DIST_PATH_MAC)`);
        process.exit(1);
    }

    const distPath = path.resolve(__dirname, '../dist');

    if (!fs.existsSync(distPath)) {
        console.error('dist directory not found. Please run build first.');
        process.exit(1);
    }

    // 3. Clean target directory
    if (fs.existsSync(targetPath)) {
        const absoluteTargetPath = path.resolve(targetPath);
        console.log(`Cleaning target directory: ${absoluteTargetPath}...`);

        try {
            if (process.platform === 'win32') {
                // On Windows, use a shell command to more aggressively remove items that might be locked or have path issues
                console.log('Using PowerShell for cleaning...');
                // Get-ChildItem -Path ... | Remove-Item -Recurse -Force
                const cmd = `powershell -Command "Get-ChildItem -Path '${absoluteTargetPath}' | Remove-Item -Recurse -Force"`;
                execSync(cmd, { stdio: 'inherit' });
            } else {
                const items = fs.readdirSync(absoluteTargetPath);
                console.log(`Found ${items.length} items in target directory.`);
                for (const item of items) {
                    const curPath = path.resolve(absoluteTargetPath, item);
                    console.log(`Removing: ${curPath}`);
                    fs.rmSync(curPath, { recursive: true, force: true });
                }
            }
            console.log('Cleanup finished.');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Error during cleanup: ${message}`);
            // We'll continue anyway and try to copy, which might fail but let's see.
        }
    } else {
        console.log(`Target directory ${targetPath} does not exist. Creating it...`);
        fs.mkdirSync(targetPath, { recursive: true });
    }

    console.log(`Copying dist to ${targetPath}...`);
    copyRecursiveSync(distPath, targetPath);
    console.log('Copy complete!');
}

// Function to copy directory recursively
function copyRecursiveSync(src: string, dest: string) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        // Ensure destination directory exists for file (redundant if parent created, but good for safety)
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
