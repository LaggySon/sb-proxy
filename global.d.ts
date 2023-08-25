declare global {
  type TeamData = {
    team1: Team;
    team2: Team;
  };

  type PageProps = {
    team1: Team;
    team2: Team;
  };

  type Team = {
    name: string;
    logoPath: string;
    info: string;
    score: string;
    atkDef: string;
    short: string;
    code: string;
    primaryCol: string;
    secondaryCol: string;
    advInfo: string;
  };

  type MatchInfo = {
    tier: string;
    region: string;
    dateTime: string;
    stage: string;
    week: string;
    weekNum?: string;
    mapInfo: string;
    tierTag: string;
    nextMap: string;
    ticker1: string;
    ticker2: string;
    addInfo: string;
    accColor: string;
    showPreds?: boolean;
  };

  type MapType = {
    map: string;
    image: string;
    type: string;
    info: string;
    winner: string;
    isComplete: boolean;
  };

  type TwitchStaff = {
    title: string;
    name: string;
    social: string;
  };

  type AllData = {
    twitch: TwitchStaff[];
    teams: TeamData;
    maps: MapType[];
    match: MatchInfo;
    cams?: string[];
  };
}
export default global;
export interface ProcessEnv {
  [key: string]: string | undefined;
}
