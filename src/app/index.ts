
import * as path from 'path';
// tslint:disable-next-line: match-default-export-name
import validatePackageName from 'validate-npm-package-name-typed';
import { BaseGenerator, GeneratorOptions, InquirerQuestionType } from '../BaseGenerator';
import { ProjectFiles } from '../tools/FilesAndFolders';
import { GitGenerator, GitQuestions } from '../git/GitGenerator';

export enum ProjectQuestions {
  projectType = 'projectType',
  projectName = 'projectName',
  invalidProjectName = 'invalidProjectName',
  useGit = 'useGit',
  createFolder = 'createFolder'
}

export class ProjectInfo {
  language: 'ts' | 'js';
  typ: 'app' | 'lib';
  runtime: 'node';
  sourceDirName: string;
}

export enum ProjectType {
  ts_app_node = 'ts_app_node',
  ts_lib_node = 'ts_lib_node',
  js_app_node = 'js_app_node',
  js_lib_node = 'js_lib_node'
}

// export default!!
// tslint:disable-next-line: no-default-export
export default class ProjectGenerator extends BaseGenerator<ProjectQuestions> {
  projectFiles: ProjectFiles;

  constructor(args: string | string[], options: GeneratorOptions<ProjectQuestions>) {
    super(args, options);
    super.registerMethod(this, 'prompting');

    if (process.env.NODE_ENV && process.env.NODE_ENV === 'debug') {
      this.appname = 'tmp';
      // tslint:disable-next-line: newline-per-chained-call
      if (path.basename(this.destinationPath().toLowerCase()) !== 'tmp') {
        this.destinationRoot(path.join(this.destinationPath(), 'tmp'));
      }
    }

    this.writeOptionsToAnswers(ProjectQuestions);
  }

  async initializing(): Promise<void> {

    this.logYellow(`Project path: '${this.destinationPath()}'`);

    this.questions[ProjectQuestions.projectType] = {

      type: InquirerQuestionType.list,
      message: 'Project Type',
      store: true,
      nextQuestion: ProjectQuestions.projectName,
      choices: [
        {
          name: 'Node application (Typescript)',
          value: ProjectType.ts_app_node
        },
        {
          name: 'Node library (Typescript)',
          value: ProjectType.ts_lib_node
        }
      ]
    };

    this.questions[ProjectQuestions.projectName] = {
      type: InquirerQuestionType.input,
      message: 'Project Name',
      // tslint:disable-next-line: no-unsafe-any
      default: this.getDefaultProjectName(this.options.projectName),
      validate: (v: string) => this.validateString(v),
      acceptAnswer: v => {
        const accept = validatePackageName(v.toString()).validForNewPackages;
        if (!accept) {
          this.logRed(`${v} is not a valid package name.`);
        }

        return true;
      },
      nextQuestion: ProjectQuestions.invalidProjectName
    };

    this.questions[ProjectQuestions.invalidProjectName] = {
      type: InquirerQuestionType.confirm,
      message: 'Continue anyway?',
      default: 'N',
      acceptAnswer: accepted => {

        if (!accepted) {
          // Ask again for the project name
          this.currentStep = ProjectQuestions.projectName;
        }

        return accepted;
      },
      when: () => !validatePackageName(this.answers.projectName).validForNewPackages,
      nextQuestion: ProjectQuestions.createFolder
    };

    this.questions[ProjectQuestions.createFolder] = {
      type: InquirerQuestionType.confirm,
      message: () => `Create folder '${this.answers.projectName}' ?`,
      default: 'Y',
      when: () => !this.destinationIsProjectFolder(this.answers.projectName),
      nextQuestion: ProjectQuestions.useGit
    };

    this.questions[ProjectQuestions.useGit] = {
      type: InquirerQuestionType.confirm,
      message: 'Configure git?',
      default: this.options.useGit
    };

    this.currentStep = ProjectQuestions.projectType;
  }

  async prompting(): Promise<void> {
    await super.prompting();

    if (this.answers.useGit) {

      // Load git generator
      this.composeWith(
        {
          Generator: GitGenerator,
          path: require.resolve('../git/index')
        },
        {
          [GitQuestions.rootPath]: this.destinationPath(),
          [GitQuestions.repositoryName]: this.answers.projectName
        }
      );

    }

  }

  async configuring(): Promise<void> {
    // this.git = new GitTools(this.answers.username, this.answers.repositoryName);

    this.log('Method configuring.');
  }
  // tslint:disable-next-line: no-reserved-keywords
  async default(): Promise<void> {
    this.log('Method default.');
  }

  async writing(): Promise<void> {
  }

  async conflicts(): Promise<void> {
    this.log('Method conflicts.');
  }
  async install(): Promise<void> {
    this.log('Method isntall.');
  }
  async end(): Promise<void> {
    this.log('Method end.');
  }

}
