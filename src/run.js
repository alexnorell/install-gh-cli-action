import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as path from 'path';

async function run() {
  try {
    let version = core.getInput('cli-release');
    let platform = core.getInput('platform');
    let arch = core.getInput('arch');
    console.log(`defined version: ${version}`);
    if (version === 'latest') {
      version = await getLatestReleaseTag('cli', 'cli');
      console.log(`latest version: ${version}`);
    }
    if (version) {
      console.log(`downloaded version: ${version}`);
      await getGhCli(version, platform, arch);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getGhCli(version, platform, arch) {
  let toolPath = tc.find('gh-cli', version, platform, arch);

  if (!toolPath) {
    toolPath = await downloadGhCli(version, platform, arch);
  }

  toolPath = path.join(toolPath, 'bin');
  core.addPath(toolPath);
}

async function getLatestReleaseTag(owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    try {
        const axios = require('axios');
        axios.get(url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }).then(response => {
          const data = response.data;
          return data.tag_name;
        }).catch(error => {
            console.error("Failed to fetch:", error);
        });

    } catch (error) {
        console.error("Failed to fetch the latest release tag:", error);
        return null;
    }
}

async function downloadGhCli(version, platform, arch) {
  const toolDirectoryName = `gh_${version}_${platform}_${arch}`;
  const downloadUrl = `https://github.com/cli/cli/releases/download/${version}/gh_${version}_${platform}_${arch}.tar.gz`;
  console.log(`downloading ${downloadUrl}`);

  try {
    const downloadPath = await tc.downloadTool(downloadUrl);
    const extractedPath = await tc.extractTar(downloadPath);
    let toolRoot = path.join(extractedPath, toolDirectoryName);
    return await tc.cacheDir(toolRoot, 'gh-cli', version, platform, arch);
  } catch (err) {
    throw err;
  }
}

run();
