import { Nested, TypeSaveProperty } from 'dotup-ts-types';
import { BaseGenerator, ConfirmQuestion, InquirerQuestionType, Question } from 'dotup-typescript-yeoman-generators';
import { GithubGenerator, GithubQuestions } from '../github/GithubGenerator';
import { IStringProperty } from '../types';
import { GitConfig } from './gitconfig';

export enum GitQuestions {
  directoryIsGitRepository = 'directoryIsGitRepository',
  repositoryName = 'repositoryName',
  rootPath = 'rootPath',
  useGithub = 'useGithub'
  // userName = 'userName',
  // userEmail = 'userEmail'
}

// Or export default!!
export class GitGenerator extends BaseGenerator<GitQuestions> {

  constructor(args: string | string[], options: Partial<TypeSaveProperty<Nested<GitQuestions, string>>>) {
    super(args, options);
    super.registerMethod(this);

    const opt = <IStringProperty>this.options;
    if (opt.rootPath === undefined) {
      throw new Error('rootPath option required.');
    }
    this.writeOptionsToAnswers(GitQuestions);
  }

  async initializing(): Promise<void> {

    const gitconfig = GitConfig.getConfig(this.answers.rootPath);

    if (gitconfig !== undefined) {

      // Existing git config
      this.logRed('Git already configured for current folder!');
      throw new Error('Git already configured for current folder!');

    }

    const opt = <IStringProperty>this.options;

    // Repo name
    this.addQuestion(
      new Question(GitQuestions.repositoryName, {
        type: InquirerQuestionType.input,
        default: opt.repositoryName,
        message: 'Enter repository name',
        description: 'Name of the repository',
        When: () => opt.repositoryName === undefined
      })
    );

    // Root path
    // this.addQuestion(
    //   new Question(GitQuestions.rootPath, {
    //     type: InquirerQuestionType.input,
    //     message: 'Project root path'
    //     // when: () => this.options.rootPath === undefined
    //   })
    // );

    // Use github?
    this.addQuestion(
      new ConfirmQuestion(GitQuestions.useGithub, 'Configure github?')
    );

  }

  async prompting(): Promise<void> {
    await super.prompting();

    if (this.answers.useGithub) {
      // Load git generator
      this.composeWith(
        // Generator
        {
          Generator: GithubGenerator,
          path: require.resolve('../github/index')
        },
        // Options
        {
          [GithubQuestions.repositoryName]: this.answers.repositoryName
        }
        // Settings
      );

    }
  }

  async configuring(): Promise<void> {
    // init only when no repo exists
    const gitconfig = GitConfig.getConfig(this.answers.rootPath);

    if (gitconfig === undefined) {
      const result = this.spawnCommandSync('git', ['init']);
    }
  }

  // tslint:disable-next-line: no-reserved-keywords
  // async default(): Promise<void> { }

  async install(): Promise<void> {
  }

  async end(): Promise<void> {

    let result = this.spawnCommandSync('git', ['add', '.']);
    result = this.spawnCommandSync('git',
      // tslint:disable-next-line: align
      [
        'commit',
        '-a',
        '-m INITIAL COMMIT by dotup-typescript yeoman generator'
      ]
    );

  }

 }
