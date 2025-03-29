import { Context } from '@actions/github/lib/context.js';
import { Octokit } from '@octokit/core';
export type GitMode = '100644' | '100755' | '040000' | '160000' | '120000';
export interface GitBlob {
    path: string;
    mode: GitMode;
    type: 'blob';
    sha: string;
}
export declare function buildCommitMessage(message?: string, file?: string): string;
export declare function normalizeRef(ref: string): string;
export declare function getRef(ref: string, context: Context, octokit: InstanceType<typeof Octokit>): Promise<string>;
export declare function getTree(sha: string, context: Context, octokit: InstanceType<typeof Octokit>): Promise<string>;
export declare function getFileMode(file: string, symlink: boolean): GitMode;
export declare function createBlob(file: string, workspace: string, symlink: boolean, context: Context, octokit: InstanceType<typeof Octokit>): Promise<GitBlob>;
export declare function createTree(blobs: GitBlob[], headTree: string, context: Context, octokit: InstanceType<typeof Octokit>): Promise<string>;
export declare function createCommit(tree: string, headCommit: string, message: string, context: Context, octokit: InstanceType<typeof Octokit>): Promise<string>;
export declare function updateRef(ref: string, sha: string, force: boolean, context: Context, octokit: InstanceType<typeof Octokit>): Promise<string>;
