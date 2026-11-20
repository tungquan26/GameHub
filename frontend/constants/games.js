import lol from "@/assets/game/leagueoflegends.png";
import valorant from "@/assets/game/valorant.png";
import tft from "@/assets/game/teamfighttactics.png";
import cs2 from "@/assets/game/counterstrike2.png";
import deltaForce from "@/assets/game/deltaforce.png";
import lienQuan from "@/assets/game/lienquanmobile.png";
import freeFire from "@/assets/game/freefire.png";
import wildRift from "@/assets/game/leagueoflegendswildrift.png";

// Ảnh, tên hiển thị và bí danh cho các game có sẵn tài nguyên.
export const GAME_ARTWORK = [
  { id: "Liên Minh Huyền Thoại", name: "Liên Minh Huyền Thoại", slug: "leagueoflegends", image: lol, aliases: ["League of Legends", "LoL"] },
  { id: "Valorant", name: "Valorant", slug: "valorant", image: valorant },
  { id: "Teamfight Tactics", name: "Đấu Trường Chân Lý", slug: "teamfighttactics", image: tft, aliases: ["TFT", "Đấu Trường Chân Lý", "Đấu Trường Chân Lý"] },
  { id: "CS2", name: "Counter-Strike 2", slug: "counterstrike2", image: cs2, aliases: ["Counter-Strike 2", "Counter Strike 2"] },
  { id: "Delta Force", name: "Delta Force", slug: "deltaforce", image: deltaForce },
  { id: "Liên Quân Mobile", name: "Liên Quân Mobile", slug: "lienquanmobile", image: lienQuan, aliases: ["Liên Quân", "Arena of Valor"] },
  { id: "Free Fire", name: "Free Fire", slug: "freefire", image: freeFire, aliases: ["Garena Free Fire"] },
  { id: "League of Legends: Wild Rift", name: "Liên Minh Huyền Thoại: Tốc Chiến", slug: "leagueoflegendswildrift", image: wildRift, aliases: ["League of Legends Wild Rift", "Wild Rift", "Tốc Chiến", "Liên Minh Huyền Thoại: Tốc Chiến"] },
];

export const BRACKET_FORMATS = [
  { value: "SINGLE_ELIMINATION", label: "Loại trực tiếp (Single Elimination)" },
  { value: "DOUBLE_ELIMINATION", label: "Nhánh thắng - Nhánh thua (Double Elimination)" },
  { value: "ROUND_ROBIN", label: "Vòng tròn tính điểm (Round Robin)" },
  { value: "SWISS", label: "Thể thức Thụy Sĩ" },
];
