import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/App";
import { TourneyProvider } from "@/context/TourneyContext";
import { STORE_KEY } from "@/lib/tourney-store";
import { findSample } from "@/constants/tournament-catalog";
import { generateBracket, findMatch, updateBracketMatch } from "@/lib/bracket";
import { gameLabel, getGame } from "@/lib/games";

const user = { id:7, username:"Captain" };
const cup = { id:1, ownerId:7, name:"Created Cup", game:"TFT", attendees:918275, startDate:"2099-11-10T10:00", endDate:"2099-11-15T18:00", tournamentTeams:[] };
const stored = () => JSON.parse(localStorage.getItem(STORE_KEY));
function open(path, extra = {}) {
  localStorage.setItem(STORE_KEY,JSON.stringify({version:1,rememberLogin:true,profile:user,tournaments:[cup],activeTournamentId:1,teams:[],...extra}));
  return render(<MemoryRouter initialEntries={[path]}><TourneyProvider><AppRoutes /><nav aria-label="Test navigation"><Link to="/dashboard">Overview</Link><Link to="/events">Events</Link><Link to="/profile">Profile</Link><Link to="/community">Teams</Link></nav></TourneyProvider></MemoryRouter>);
}
beforeEach(() => vi.stubGlobal("fetch",vi.fn(async () => new Response("[]",{headers:{"Content-Type":"application/json"}}))));

describe("Hiển thị giải thống nhất", () => {
  it("đăng ký giải có sẵn cập nhật dashboard/events/hồ sơ, giữ ID nguồn và quyền quản lý", async () => {
    open("/tournament/view?id=1&sample=1"); const action = userEvent.setup();
    await screen.findByRole("heading",{name:findSample(1).name,level:1});
    expect(screen.queryByText(/GIẢI ĐẤU MẪU|Giải mẫu|lưu.*thiết bị/i)).not.toBeInTheDocument();
    await action.click(screen.getByRole("button",{name:"Đăng ký tham gia"}));
    await action.click(screen.getByRole("link",{name:"Overview",exact:true}));
    await screen.findByRole("link",{name:"Giải tham gia: 1"});
    expect(screen.getByRole("link",{name:"Giải tổ chức: 1"})).toBeInTheDocument();
    await action.click(screen.getByRole("link",{name:"Events",exact:true}));
    expect(await screen.findByRole("link",{name:`Xem giải đấu ${findSample(1).name}`})).toHaveAttribute("href",expect.stringContaining("sample=1"));
    const real = screen.getByRole("link",{name:"Xem giải đấu Created Cup"});
    expect(real).toHaveAttribute("href","/tournament/view?id=1");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.queryByText("918275")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link",{name:/^Quản lý giải đấu /})).toHaveLength(1);
    expect(screen.queryByText(/Giải mẫu|Hoạt động trên giải mẫu|lưu.*thiết bị/i)).not.toBeInTheDocument();
    await action.click(screen.getByRole("link",{name:"Profile",exact:true}));
    const participating = (await screen.findByRole("heading",{name:"GIẢI ĐẤU THAM GIA"})).closest("section");
    expect(within(participating).getByRole("link",{name:new RegExp(findSample(1).name)})).toHaveAttribute("href",expect.stringContaining("sample=1"));
    expect(stored().tournaments[0].ownerId).toBe(7);
    expect(stored().registeredTournaments[0]).toMatchObject({sample:true,registrantKey:"id:7"});
  });
  it("đội có danh tính được tính chung nhưng dấu nguồn không cấp quyền đội trưởng", async () => {
    const team={id:"demo",name:"Joined Team",sample:true,captain:"Captain",captainKey:"id:7",members:["Captain"],memberIdentities:{"id:7":"Captain"},pendingRequests:[],game:"Valorant",recruiting:true};
    open("/dashboard",{teams:[team]});
    expect(await screen.findByRole("link",{name:"Đội của tôi: 1"})).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link",{name:"Teams",exact:true}));
    const mine = await screen.findByRole("region",{name:"Đội tuyển của tôi"});
    expect(within(mine).getByRole("article",{name:"Joined Team"})).toBeInTheDocument();
    expect(within(mine).queryByRole("button",{name:"Chỉnh sửa Team"})).not.toBeInTheDocument();
    expect(screen.queryByText(/Đội mẫu|Hoạt động ở đội mẫu|lưu.*thiết bị/i)).not.toBeInTheDocument();
  });
  it("tên game gọn trong danh sách và bộ lọc; alias cũ vẫn giữ ID/slug", async () => {
    for (const alias of ["TFT","Teamfight Tactics","Đấu Trường Chân Lý (TFT)"]) {
      expect(gameLabel(alias)).toBe("Đấu Trường Chân Lý"); expect(getGame(alias).slug).toBe("teamfighttactics");
    }
    open("/search?game=teamfighttactics");
    const link=await screen.findByRole("link",{name:"Xem giải đấu Created Cup"});
    expect(link).toHaveTextContent("Đấu Trường Chân Lý");expect(link).not.toHaveTextContent("(TFT)");expect(link).not.toHaveTextContent("918275");
    await userEvent.click(screen.getByRole("button",{name:"Bộ lọc (1)"}));
    expect(screen.getByRole("checkbox",{name:"Đấu Trường Chân Lý",exact:true})).toBeChecked();
  });
});

describe("Nhánh đấu TBD trên giao diện và đồng bộ tab", () => {
  it("nhánh mới không có đội tự sinh; trận chưa đủ đội chỉ đổi giờ", async () => {
    open("/tournament/schedule?id=1");
    const tree=await screen.findByRole("region",{name:"Sơ đồ nhánh đấu"});
    expect(within(tree).getAllByText("TBD")).toHaveLength(14);
    expect(within(tree).queryByRole("button",{name:"Nhập kết quả"})).not.toBeInTheDocument();
    const first=within(tree).getByRole("article",{name:"Trận #1",exact:true});
    expect(within(first).getByText("Chờ xác định đội")).toBeInTheDocument();
    await userEvent.click(within(first).getByRole("button",{name:"Đổi giờ đấu"}));
    const dialog=screen.getByRole("dialog"); expect(within(dialog).queryByRole("button",{name:"Lưu kết quả"})).not.toBeInTheDocument();
    expect(within(dialog).getAllByRole("spinbutton").every((input)=>input.disabled)).toBe(true);
    fireEvent.change(within(dialog).getByLabelText("Thời gian thi đấu"),{target:{value:"2099-11-11T16:00"}});
    await userEvent.click(within(dialog).getByRole("button",{name:"Chỉ lưu giờ đấu"}));
    await waitFor(()=>expect(findMatch(stored().brackets["tournament:1"],101)).toMatchObject({scheduledTime:"2099-11-11T16:00",teamA:null,teamB:null,result:null}));
    expect(screen.queryByText(/BTP Esports|Saigon Phantoms|đội mẫu/i)).not.toBeInTheDocument();
  });
  it("storage event dọn đội tự sinh và kết quả phụ thuộc ngay trên lịch đang mở", async () => {
    const teams=Array.from({length:4},(_,index)=>({id:index+1,name:`Team ${index+1}`,members:[]}));
    const entry={...cup,tournamentTeams:teams}; open("/tournament/schedule?id=1",{tournaments:[entry]});
    await screen.findByRole("region",{name:"Sơ đồ nhánh đấu"});
    const fake={id:"sample-team-0",sample:true,name:"Auto Generated Team"};
    let old=generateBracket({...entry,tournamentTeams:[teams[0],fake,teams[2],teams[3]]},4);
    for(const id of [101,102,201])old=updateBracketMatch(old,id,{scoreA:2,scoreB:0});
    const state={...stored(),brackets:{"tournament:1":old}};
    await act(async()=>window.dispatchEvent(new StorageEvent("storage",{key:STORE_KEY,newValue:JSON.stringify(state),storageArea:localStorage})));
    expect(screen.queryByText("Auto Generated Team")).not.toBeInTheDocument();
    expect(screen.queryByText("NHÀ VÔ ĐỊCH")).not.toBeInTheDocument();
    await waitFor(()=>expect(findMatch(stored().brackets["tournament:1"],201)).toMatchObject({teamA:null,teamB:{id:3},result:null}));
    expect(findMatch(stored().brackets["tournament:1"],102).result).not.toBeNull();
  });
});
