export interface HistoricalVersion {
    version: string;
    changelogContent: string;
}

export interface VersionInfo {
    buildTime: string;
    gitTag: string;
    version: string;
    versionIsNew?: boolean;
    versionNewLink?: string;
    versionNewName?: string;
    versionNewChangelog?: string;
    versionNewChangelogContent?: string;
    versionHistory?: HistoricalVersion[];
}
