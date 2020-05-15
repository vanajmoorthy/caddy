const CLI = require("clui");
const Configstore = require("configstore");
const Octokit = require("@octokit/rest");
const Spinner = CLI.Spinner;
const { createBasicAuth } = require("@octokit/auth-basic");

const prompt = require("./prompt");
const package = require("../package.json");

const conf = new Configstore(package.name);

let octokit;

module.exports = {
	getInstance: () => {
		return octokit;
	},

	getStoredToken: () => {
		return conf.get("github.token");
	},

	githubAuth: (token) => {
		octokit = new Octokit({
			auth: token,
		});
	},

	getPersonalAccessToken: async () => {
		const credentials = await prompt.promptCredentials();
		const status = new Spinner("Authenticating you, please wait a sec...");

		status.start();

		const auth = createBasicAuth({
			username: credentials.username,
			password: credentials.password,
			async on2Fa() {
				status.stop();
				const res = await prompt.getTwoFactorAuthCode();
				status.start();
				return res.twoFactorAuthenticationCode;
			},
			token: {
				scopes: ["user", "public_repo", "repo", "repo:status"],
			},
		});

		try {
			const res = await auth();

			if (res.token) {
				conf.set("github.token", res.token);
				return res.token;
			} else {
				throw new Error("GitHub token was not found.");
			}
		} finally {
			status.stop();
		}
	},
};
