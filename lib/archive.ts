export type Sighting={id:number;song:string;artist:string;game:string;sport:string;network:string;date:string;source:string;notes:string;status:string};
const source="https://www.si.com/nfl/2020/12/17/fox-producer-who-got-the-nfl-to-jam";
export const archive:Sighting[]=[
{id:-1,song:"Happy Hour Hero",artist:"moe.",game:"Chiefs at Bills",sport:"NFL",network:"FOX",date:"2020-10",source,notes:"First television timeout. Reported by Sports Illustrated; exact broadcast date is not specified in the report.",status:"Documented"},
{id:-2,song:"Stash",artist:"Phish",game:"Thanksgiving broadcast",sport:"NFL",network:"FOX",date:"2020-11-26",source,notes:"Played on Thanksgiving, followed by Saint of Circumstance at the next break. Matchup not identified in the source.",status:"Documented"},
{id:-3,song:"Saint of Circumstance",artist:"Grateful Dead",game:"Thanksgiving broadcast",sport:"NFL",network:"FOX",date:"2020-11-26",source,notes:"Followed Stash on consecutive commercial breaks. Matchup not identified in the source.",status:"Documented"},
{id:-4,song:"Tweezer (Reprise)",artist:"Phish",game:"Super Bowl LI · Falcons feature",sport:"NFL",network:"FOX",date:"2017-02-05",source,notes:"Pregame Falcons highlight package narrated by Ving Rhames. A sports-broadcast music cue, rather than a commercial-break outro.",status:"Documented"}
];
