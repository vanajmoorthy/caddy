#!/usr/bin/env node

const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");

const files = require("./src/files");
const github = require("./src/github-auth");
const repo = require("./src/repo");

clear();

console.log(
	chalk.cyan(
		figlet.textSync("caddy", {
			font: "Chunky",
		})
	)
);

if (files.directoryExists(".git")) {
	console.log(chalk.red("There's already a git repository here!"));
	process.exit();
}

async function getGithubToken() {
	let token = github.getStoredToken();

	if (token) {
		return token;
	}

	token = await github.getPersonalAccessToken();

	return token;
}

async function run() {
	try {
		const token = await getGithubToken();
		github.githubAuth(token);

		const url = await repo.createRemoteRepo();

		await repo.createGitignore();

		await repo.setupRepo(url);

		console.log(chalk.green("Finished!"));
	} catch (err) {
		if (err) {
			switch (err.status) {
				case 401:
					console.log(
						chalk.red(
							"Sorry, we couldn't manage to log you in. Please provide the correct credentials."
						)
					);
					break;
				case 422:
					console.log(
						chalk.red(
							"A remote repository or token with that name already exists on your account."
						)
					);
					break;
				default:
					console.log(chalk.red(err));
			}
		}
	}
}

run();
