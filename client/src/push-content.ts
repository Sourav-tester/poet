import vscode, { InputBoxOptions } from 'vscode'
import { expect } from './utils'
import { GitExtension, GitErrorCodes, CommitOptions, Repository } from './git-api/git'

export const getRepo = (): Repository => {
  const gitExtension = expect(vscode.extensions.getExtension<GitExtension>('vscode.git')).exports
  const api = gitExtension.getAPI(1)
  const result: Repository = api.repositories[0]
  return result
}

export const pushContent = () => async () => {
  _pushContent(getRepo, vscode.window.showInformationMessage, vscode.window.showErrorMessage)
}

export const _pushContent = (_getRepo: () => Repository, infoReporter: (msg: string) => Thenable<string | undefined>, errorReporter: (msg: string) => Thenable<string | undefined>) => async () => {
  const repo = _getRepo()
  const commitOptions: CommitOptions = { all: true }

  let commitSucceeded = false

  // let message = ""


  // vscode.window.showInputBox({ prompt: 'Push Message: ', placeHolder: '...' }).then(value => {
  //   if (value === undefined) {
  //     void errorReporter('Push cancelled.')
  //     throw new Error('cancelled');
  //   }
  //   // handle valid values
  // });

  await vscode.window.showInputBox({
    prompt: 'Push Message: ',
    placeHolder: '...',
    validateInput: text => {
      vscode.window.showInformationMessage(`Validating: ${text}`);  // you don't need this
      return text === '123' ? null : 'Not 123!';  // return null if validates
    }
  });

  try {
    await repo.commit('poet commit', commitOptions)
    commitSucceeded = true
  } catch (e) {
    console.log(e)
    if (e.stdout == null) { throw e }
    if ((e.stdout as string).includes('nothing to commit')) {
      void errorReporter('No changes to push.')
    } else {
      const message: string = e.gitErrorCode === undefined ? e.message : e.gitErrorCode
      void errorReporter(`Push failed: ${message}`)
    }
  }

  if (commitSucceeded) {
    try {
      await repo.pull()
      await repo.push()
      void infoReporter('Successful content push.')
    } catch (e) {
      console.log(e)
      if (e.gitErrorCode == null) { throw e }
      if (e.gitErrorCode === GitErrorCodes.Conflict) {
        void errorReporter('Content conflict, please resolve.')
      } else {
        void errorReporter(`Push failed: ${e.message as string}`)
      }
    }
  }
}
