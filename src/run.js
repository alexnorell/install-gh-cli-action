import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as path from 'path';

async function run() {
  try {
    let version = core.getInput('cli-release');
    let platform = core.getInput('platform');
    let arch = core.getInput('arch');
    if (version === 'latest') {
      version = await getLatestReleaseTag('cli', 'cli');
      console.log(`latest version: ${version}`);
    }
    if (version) {
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

const axios = require('axios');

async function getLatestReleaseTag(owner, repo) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        return response.data.tag_name;
    } catch (error) {
        console.error("Failed to fetch the latest release tag:", error);
        return null;
    }
}

async function downloadGhCli(version, platform, arch) {
  const strippedVersion = version.replace(/^v/, '');
  const toolDirectoryName = `gh_${strippedVersion}_${platform}_${arch}`;
  const downloadUrl = `https://github.com/cli/cli/releases/download/${version}/${toolDirectoryName}.tar.gz`;
  console.log(`downloading: ${downloadUrl}`);

  try {
    const downloadPath = await tc.downloadTool(downloadUrl);
    console.log(`extracting: ${downloadPath}`);
    const extractedPath = await tc.extractTar(downloadPath);
    console.log(`extracted: ${extractedPath}`);
    let toolRoot = path.join(extractedPath, toolDirectoryName);
    return await tc.cacheDir(toolRoot, 'gh-cli', strippedVersion, platform, arch);
  } catch (err) {
    throw err;
  }
}

run();
