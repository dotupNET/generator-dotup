import { GitConfig } from 'dotup-ts-github-api';
import { Nested, TypeSaveProperty } from 'dotup-ts-types';
import { BaseGenerator, ConfirmQuestion, InquirerQuestionType, Question } from 'dotup-typescript-yeoman-generators';
import { GithubGenerator, GithubQuestions } from '../github/GithubGenerator';
import { IProperty } from '../types';

export enum GitQuestions {
  directoryIsGitRepository = 'directoryIsGitRepository',
  repositoryName = 'repositoryName',
  rootPath = 'rootPath',
  useGithub = 'useGithub',
  userName = 'userName',
  // userEmail = 'userEmail'
}

// Or export default!!
export class GitGenerator extends BaseGenerator<GitQuestions> {

  constructor(args: string | string[], options: Partial<TypeSaveProperty<Nested<GitQuestions, string>>>) {
    super(args, options);
    super.registerMethod(this);

    const opt = <IProperty>this.options;
    if (opt.rootPath === undefined) {
      throw new Error('rootPath option required.');
    }
    this.writeOptionsToAnswers(GitQuestions);
  }

  async initializing(): Promise<void> {

    const gitconfig = GitConfig.getConfig(this.answers.rootPath);

    if (gitconfig !== undefined) {

      // Existing git config
      this.logRed('Git already configured for current folder! Git generator skipped.');
      // throw new Error('Git already configured for current folder!');
      this.skipGenerator = true;

      return;
    }

    const opt = <IProperty>this.options;

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
    if (this.skipGenerator) { return; }

    await super.prompting();

    if (this.answers.useGithub) {
      // Load git generator
      this.composeWith(
        // Generator
        <any>{
          Generator: GithubGenerator,
          path: require.resolve('../github/index')
        },
        // Options
        {
          [GithubQuestions.repositoryName]: this.answers.repositoryName,
          [GithubQuestions.userName]: this.answers.userName
        }
        // Settings
      );

    }
  }

  async configuring(): Promise<void> {
    if (this.skipGenerator) { return; }

    // init only when no repo exists
    const gitconfig = GitConfig.getConfig(this.answers.rootPath);

    if (gitconfig === undefined) {
      const result = this.spawnCommandSync('git', ['init']);
    }
  }

  // tslint:disable-next-line: no-reserved-keywords
  // async default(): Promise<void> { }

  async install(): Promise<void> {
    if (this.skipGenerator) { return; }

  }

  async end(): Promise<void> {
    if (this.skipGenerator) { return; }

    let result = this.spawnCommandSync('git', ['add', '.']);
    result = this.spawnCommandSync('git',
      [
        'commit',
        '-a',
        '-m INITIAL COMMIT by dotup-typescript yeoman generator'
      ]
    );

  }

}