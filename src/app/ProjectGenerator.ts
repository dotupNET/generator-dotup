// tslint:disable-next-line: max-line-length
import { BaseGenerator, GeneratorOptions, InputQuestion, InquirerQuestionType, Question, StoreQuestion } from 'dotup-typescript-yeoman-generators';
import inquirer = require('inquirer');
import validateNpmPackageNameTyped from 'validate-npm-package-name-typed';
import { GitQuestions } from 'generator-dotup-git/generators/app/GitQuestions'; // '../git/GitGenerator';
import { TypescriptAppGenerator } from '../ts-app/TypescriptAppGenerator';
import { TypescriptLibGenerator } from '../ts-lib/TypescriptLibGenerator';
import { YeomanGeneratorGenerator } from '../ts-yogen/YeomanGeneratorGenerator';
import { TsQuestions } from '../ts/TypescriptGenerator';
import { ITypedProperty } from '../types';

export enum ProjectQuestions {
  projectType = 'projectType',
  projectName = 'projectName',
  userName = 'userName',
  userEmail = 'userEmail',
  invalidProjectName = 'invalidProjectName',
  useGit = 'useGit',
  createFolder = 'createFolder'
}

export enum ProjectType {
  ts_app_node = 'ts_app_node',
  ts_lib_node = 'ts_lib_node',
  ts_yo_generator = 'ts_yo_generator',
  js_app_node = 'js_app_node',
  js_lib_node = 'js_lib_node'
}

// export default!!
export class ProjectGenerator extends BaseGenerator<ProjectQuestions> {

  constructor(args: string | string[], options: GeneratorOptions<ProjectQuestions>) {
    super(args, options);
    super.registerMethod(this);

    this.writeOptionsToAnswers(ProjectQuestions);
  }

  async initializing(): Promise<void> {

    // Project name
    this.addQuestion(
      new Question(ProjectQuestions.projectName, {
        message: 'Project Name',
        type: InquirerQuestionType.input,
        default: this.getDefaultProjectName(),
        validate: (v: string) => this.validateString(v),
        acceptAnswer: v => {
          const accept = validateNpmPackageNameTyped(v.toString()).validForNewPackages;
          if (!accept) {
            this.logRed(`${v} is not a valid package name.`);
          }

          return true;
        }
      })
    );

    // Invalid project name
    this.addQuestion(
      new Question(ProjectQuestions.invalidProjectName, {
        message: 'Continue anyway?',
        type: InquirerQuestionType.confirm,
        default: 'N',
        acceptAnswer: accepted => {

          if (!accepted) {
            // Ask again for the project name
            this.currentStep = ProjectQuestions.projectName;
          }

          return accepted;
        },
        When: () => !validateNpmPackageNameTyped(this.answers.projectName).validForNewPackages
      })
    );

    // Create folder?
    this.addQuestion(
      new Question(ProjectQuestions.createFolder, {
        type: InquirerQuestionType.confirm,
        message: () => `Create folder '${this.answers.projectName}' ?`,
        default: 'Y',
        When: () => !this.destinationIsProjectFolder(this.answers.projectName),
        acceptAnswer: accepted => {
          if (accepted) {
            // Create new root
            this.destinationRoot(this.destinationPath(this.answers.projectName));
            this.logGreen(`Destination path changed to ${this.destinationPath()}`);
          }

          return accepted;
        }
      })
    );

    // Project type
    this.addQuestion(
      new StoreQuestion(ProjectQuestions.projectType, {
        message: 'Project Type',
        type: InquirerQuestionType.list,
        choices: [
          {
            name: 'Node application (Typescript)',
            value: ProjectType.ts_app_node
          },
          {
            name: 'Node library (Typescript)',
            value: ProjectType.ts_lib_node
          },
          {
            name: 'Yeoman generator (Typescript)',
            value: ProjectType.ts_yo_generator
          }
        ]
      })
    );

    // User name
    this.addQuestion(
      new InputQuestion(ProjectQuestions.userName, 'Enter your name (package.json)')
    );

    // User email
    this.addQuestion(
      new InputQuestion(ProjectQuestions.userEmail, 'Enter your email (package.json)')
    );

    this.addQuestion(
      new StoreQuestion(ProjectQuestions.useGit, {
        type: InquirerQuestionType.confirm,
        message: 'Configure git?'
        // default: this.options.useGit
      })
    );
  }

  async prompting(): Promise<void> {
    await super.prompting();

    this.projectInfo.language = 'ts';
    this.projectInfo.runtime = 'node';
    this.projectInfo.typ = 'app';

    if (this.answers.useGit) {

      // const args = {
      //   Generator: (<any>GitGenerator),
      //   path: require.resolve('../git/index')
      // };

      console.log(GitQuestions.rootPath);

      // Load git generator
      this.composeWith(
        // <any>args,
        require.resolve('generator-dotup-git/generators/app'),
        {
          [GitQuestions.rootPath]: this.destinationPath(),
          [GitQuestions.repositoryName]: this.answers.projectName,
          [GitQuestions.userName]: this.answers.userName
        }
      );

    }

    // Application type generator
    switch (this.answers.projectType) {

      case ProjectType.ts_app_node:

        this.composeWith(
          <any>{
            Generator: TypescriptAppGenerator,
            path: require.resolve('../ts-app/index')
          },
          {
            [TsQuestions.projectName]: this.answers.projectName,
            [TsQuestions.sourcePath]: 'src',
            [TsQuestions.targetPath]: 'dist',
            [TsQuestions.testPath]: 'test',
            [TsQuestions.docsPath]: 'docs',
            [TsQuestions.mainFile]: 'app.js',
            [TsQuestions.typesFile]: 'app.d.ts'
          }
        );

        break;

      case ProjectType.ts_lib_node:

        this.composeWith(
          <any>{
            Generator: TypescriptLibGenerator,
            path: require.resolve('../ts-lib/index')
          },
          {
            [TsQuestions.projectName]: this.answers.projectName,
            [TsQuestions.sourcePath]: 'src',
            [TsQuestions.targetPath]: 'dist',
            [TsQuestions.testPath]: 'test',
            [TsQuestions.docsPath]: 'docs',
            [TsQuestions.mainFile]: 'index.js',
            [TsQuestions.typesFile]: 'index.d.ts'
          }
        );

        break;

      case ProjectType.ts_yo_generator:

        this.composeWith(
          <any>{
            Generator: YeomanGeneratorGenerator,
            path: require.resolve('../ts-yogen/index')
          },
          {
            [TsQuestions.projectName]: this.answers.projectName,
            [TsQuestions.sourcePath]: 'src',
            [TsQuestions.targetPath]: 'generators',
            [TsQuestions.testPath]: 'test',
            [TsQuestions.docsPath]: 'docs',
            [TsQuestions.mainFile]: 'app/index.js',
            [TsQuestions.typesFile]: 'app/index.d.ts'
          }
        );

        break;

      default:
        throw new Error('Project type not implemented');
    }

  }

  async configuring(): Promise<void> {
    // this.git = new GitTools(this.answers.username, this.answers.repositoryName);
  }

  async install(): Promise<void> {
  }

  async end(): Promise<void> {
    this.logGreen('Your project is ready.');

    const q = {
      name: 'vscode',
      message: 'Should I start vscode?',
      default: 'Y',
      type: InquirerQuestionType.confirm
    };

    const result: ITypedProperty<boolean> = await inquirer.prompt(q);

    if (result.vscode === true) {
      this.spawnCommandSync('code', [this.destinationPath()]);
    }
  }

}
