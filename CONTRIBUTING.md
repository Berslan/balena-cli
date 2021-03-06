# Contributing

The balena CLI is an open source project and your contribution is welcome!

* Install the dependencies listed in the [NPM Installation](./INSTALL.md#npm-installation)
  section of the `INSTALL.md` file. Check the section [Additional
  Dependencies](./INSTALL.md#additional-dependencies) too.
* Clone the `balena-cli` repository, `cd` to it and run `npm install`.
* Build the CLI with `npm run build` or `npm test`, and execute it with `./bin/balena`
  (on a Windows command prompt, you may need to run `node .\bin\balena`).

In order to ease development:

* `npm run build:fast` skips some of the build steps for interactive testing, or
* `./bin/balena-dev` uses `ts-node/register` and `coffeescript/register` to transpile on the fly.

Before opening a PR, test your changes with `npm test`. Keep compatibility in mind, as the CLI is
meant to run on Linux, macOS and Windows. balena CI will run test code on all three platforms, but
this will only help if you add some test cases for your new code!

## Semantic versioning and commit messages

The CLI version numbering adheres to [Semantic Versioning](http://semver.org/). The following
header/row is required in the body of a commit message, and will cause the CI build to fail if absent:

```
Change-type: patch|minor|major
```

Version numbers and commit messages are automatically added to the `CHANGELOG.md` file by the CI
build flow, after a pull request is merged. It should not be manually edited.

## Editing documentation files (CHANGELOG, README, website...)

The `doc/cli.markdown` file is automatically generated by running `npm run build:doc` (which also
runs as part of `npm run build`). That file is then pulled by scripts in the
[balena-io/docs](https://github.com/balena-io/docs/) GitHub repo for publishing at the [CLI
Documentation page](https://www.balena.io/docs/reference/cli/).

The content sources for the auto generation of `doc/cli.markdown` are:

* Selected sections of the README file.
* The CLI's command documentation in source code (both Capitano and oclif commands), for example:
  * `lib/actions/build.coffee`
  * `lib/actions-oclif/env/add.ts`

The README file is manually edited, but subsections are automatically extracted for inclusion in
`doc/cli.markdown` by the `getCapitanoDoc()` function in
[`automation/capitanodoc/capitanodoc.ts`](https://github.com/balena-io/balena-cli/blob/master/automation/capitanodoc/capitanodoc.ts).

The `INSTALL.md` and `TROUBLESHOOTING.md` files are also manually edited.

## Windows

Please note that `npm run build:installer` (which generates the `.exe` executable installer on
Windows) specifically requires [MSYS2](https://www.msys2.org/) to be installed. Other than that,
the standard Command Prompt or PowerShell can be used (though MSYS2 is still handy, as it provides
'git' and a number of common unix utilities). If you make changes to `package.json` scripts, check
they also run on a standard Windows Command Prompt.

## TypeScript vs CoffeeScript, and Capitano vs oclif

The CLI was originally written in [CoffeeScript](https://coffeescript.org), but we decided to
migrate to [TypeScript](https://www.typescriptlang.org/) in order to take advantage of static
typing and formal programming interfaces. The migration is taking place gradually, as part of
maintenance work or the implementation of new features.

Similarly, [Capitano](https://github.com/balena-io/capitano) was originally adopted as the CLI's
framework, but later we decided to take advantage of [oclif](https://oclif.io/)'s features such
as native installers for Windows, macOS and Linux, and support for custom flag parsing (for
example, we're still battling with Capitano's behavior of dropping leading zeros of arguments that
look like integers, such as some abbreviated UUIDs). Again, the migration is taking place
gradually, with some CLI commands parsed by oclif and others by Capitano. A simple command line
pre-parsing takes place in `preparser.ts`, to decide whether to route full parsing to Capitano or
to oclif.

## Programming style

`npm run build` also runs [prettier](https://www.npmjs.com/package/prettier), which automatically
reformats the code (based on configuration in the `node_modules/resin-lint/config/.prettierrc`
file). Beyond that, we have a preference for Javascript promises over callbacks, and for
`async/await` over `.then()`.

## Updating upstream dependencies

In order to get proper nested changelogs, when updating upstream modules that are in the repo.yml
(like the balena-sdk), the commit body has to contain a line with the following format:
```
Update balena-sdk from 12.0.0 to 12.1.0
```

Since this is error prone, it's suggested to use the following npm script:
```
npm run update balena-sdk ^12.1.0
```

This will create a new branch (only if you are currently on master), run `npm update` with the
version you provided as a target and commit the package.json & npm-shrinkwrap.json. The script by
default will set the `Change-type` to `patch` or `minor`, depending on the semver change of the
updated dependency, but if you need to use a different one (eg `major`) you can specify it as an
extra argument:
```
npm run update balena-sdk ^12.14.0 patch
npm run update balena-sdk ^13.0.0 major
```

## Common gotchas

One thing that most CLI bugs have in common is the absence of test cases exercising the broken
code, so writing some test code is a great idea. Having said that, there are also some common
gotchas to bear in mind:

* Forward slashes _vs._ backslashes in file paths. Most developers are aware that they should use
  Node.js functions like
  [path.join](https://nodejs.org/docs/latest-v12.x/api/path.html#path_path_join_paths), which will
  automatically use backslashes on Windows and forward slashes on Linux and macOS. Where people get
  caught is actually when handling paths in tar streams, which are sent to the Docker daemon and to
  balenaCloud. Tar streams use forward slashes regardless of whether the CLI runs on Linux or
  Windows, and for those paths the ideal is to use `path.posix.join` instead of `path.join`. Or,
  simply hardcode those forward slashes!

* When executing external commands, for example 'ssh', developers often rely on the shell and write
  something like `spawn('command "arg1" "arg2"', { shell: true })`. Besides the usual security
  concerns, another problem is to get argument escaping right (single quote, double quote,
  backslashes...) because of the differences between the Windows 'cmd.exe' shell and the unix
  '/bin/sh'. Most of the time, it turns out that it is possible to avoid relying on the shell
  altogether. The [which](https://www.npmjs.com/package/which) package can be used to get the full
  path of a command, resolving `'ssh'` to, say, `'C:\WINDOWS\System32\OpenSSH\ssh.EXE'`, and then
  the command can be executed directly with `spawn(fullPath, argArray, { shell: false})`. It's a
  rare combination of more secure and more interoperable with less development effort (as it avoids
  time-consuming cross-platform trial and error with argument escaping).
