
// tslint:disable-next-line: match-default-export-name
import validateNpmPackageNameTyped from 'validate-npm-package-name-typed';
import { OptionalQuestion, Question } from '../app/Question';
import { BaseGenerator, GeneratorOptions, InquirerQuestionType } from '../BaseGenerator';

export enum TsLibQuestions {
  projectName = 'projectName',
  invalidProjectName = 'invalidProjectName'
}

declare type mixed = GeneratorOptions<TsLibQuestions> & TsLibQuestions;

export class TypescriptLibGenerator extends BaseGenerator<TsLibQuestions> {

  constructor(args: string | string[], options: GeneratorOptions<TsLibQuestions>) {
    super(args, options);
    this.registerMethod(this);
    this.writeOptionsToAnswers(TsLibQuestions);
  }

  async initializing(): Promise<void> {

    // Project name
    this.addQuestion(
      new Question(TsLibQuestions.projectName, {
        type: InquirerQuestionType.input,
        message: 'Project Name',
        default: this.getDefaultProjectName(),
        validate: (v: string) => this.validateString(v),
        acceptAnswer: v => {
          const accept = validateNpmPackageNameTyped(v.toString()).validForNewPackages;
          if (!accept) {
            this.logRed(`${v} is not a valid package name.`);
          }

          return true;
        },
        When: () => this.options.projectName === undefined

      })
    );

    this.addQuestion(
      new OptionalQuestion(TsLibQuestions.invalidProjectName, {
        type: InquirerQuestionType.confirm,
        message: 'Continue anyway?',
        default: 'N',
        acceptAnswer: accepted => {

          if (!accepted) {
            // Ask again for the project name
            this.currentStep = TsLibQuestions.projectName;
          }

          return accepted;
        },
        When: () => !validateNpmPackageNameTyped(<string>this.options.projectName).validForNewPackages
      })
    );

  }

  async prompting(): Promise<void> {
    const result = await super.prompting();
  }

  async configuring(): Promise<void> {
    // this.git = new GitTools(this.answers.username, this.answers.repositoryName);
  }

  // tslint:disable-next-line: no-reserved-keywords
  // async default(): Promise<void> { }

  // async writing(): Promise<void> { }

  async install(): Promise<void> {
  }
  async end(): Promise<void> {
  }

}
