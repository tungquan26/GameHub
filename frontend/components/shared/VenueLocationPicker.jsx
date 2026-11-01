import { useEffect, useId, useRef, useState } from "react";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POPULAR_VENUES } from "@/constants/venues";
import { geocoder, hasCoordinates } from "@/lib/geocoder";
import useDebounce from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

export default function VenueLocationPicker({ value, onChange, onBusyChange }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState(null);
  const [selected, setSelected] = useState(-1);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const input = useRef(null);
  const active = useRef(null);
  const generation = useRef(0);
  const currentValue = useRef(value);
  currentValue.current = value;
  useEffect(() => () => { generation.current++; active.current?.abort(); }, []);
  const query = value.address.trim().toLocaleLowerCase("vi");
  const local = POPULAR_VENUES.filter((place) => !query || (place.main + " " + place.sub).toLocaleLowerCase("vi").includes(query)).slice(0, 4)
    .map((place) => ({ ...place, address: place.main + ", " + place.sub }));
  const options = remote ?? local;
  const mapQuery = hasCoordinates(value.lat, value.lon) ? `${value.lat},${value.lon}` : value.address.trim();
  const previewQuery = useDebounce(mapQuery, 500);
  function task(next) { setPending(next); onBusyChange?.(Boolean(next)); }
  function cancel() { generation.current++; active.current?.abort(); task(""); }
  function changeAddress(address) {
    cancel(); setRemote(null); setSelected(-1); setOpen(true); setError(""); setNotice("");
    onChange({ address, lat: null, lon: null });
  }
  function choose(place) {
    cancel(); setRemote(null); setSelected(-1); setError(""); setNotice("");
    onChange({ address: place.address, lat: place.lat, lon: place.lon });
    input.current?.focus();
    setOpen(false);
  }
  async function search() {
    const address = currentValue.current.address.trim();
    if (address.length < 2) { setError("Nhập ít nhất 2 ký tự để tìm địa điểm."); return; }
    cancel();
    const token = generation.current;
    const controller = new AbortController(); active.current = controller;
    task("search"); setError(""); setNotice(""); setOpen(true); setSelected(-1);
    try {
      const results = await geocoder.search(address, controller.signal);
      if (generation.current !== token || currentValue.current.address.trim() !== address) return;
      const merged = [...results];
      for (const place of local) if (!merged.some((item) => item.address === place.address)) merged.push(place);
      setRemote(merged.slice(0, 6));
    } catch (cause) {
      if (generation.current === token && cause.name !== "AbortError") setError("Không thể tìm địa điểm. Bạn vẫn có thể nhập địa chỉ trực tiếp.");
    } finally { if (generation.current === token) task(""); }
  }
  function locate() {
    cancel(); setError(""); setNotice(""); setOpen(false);
    if (!navigator.geolocation) { setError("Trình duyệt của bạn không hỗ trợ định vị GPS."); return; }
    const token = generation.current;
    const controller = new AbortController(); active.current = controller;
    task("gps");
    const failed = () => {
      if (generation.current !== token) return;
      setError("Không thể truy cập vị trí. Vui lòng cấp quyền định vị cho trình duyệt."); task("");
    };
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        if (generation.current !== token) return;
        const { latitude: lat, longitude: lon } = position.coords;
        if (!hasCoordinates(lat, lon)) { failed(); return; }
        let address = `${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}`;
        try {
          const place = await geocoder.reverse(lat, lon, controller.signal);
          address = place.address || address;
        } catch (cause) { if (cause.name === "AbortError") return; }
        if (generation.current !== token) return;
        onChange({ address, lat, lon }); setNotice("Đã định vị địa chỉ hiện tại thành công."); task("");
      }, failed, { enableHighAccuracy: true, timeout: 10000 });
    } catch { failed(); }
  }
  function keyDown(event) {
    if (event.key === "Escape") { setOpen(false); setSelected(-1); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); setOpen(true);
      setSelected((index) => options.length ? (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : -1);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (open && selected >= 0 && options[selected]) choose(options[selected]); else search();
    }
  }
  return <div className="space-y-3">
    <div onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-dp-read">Địa điểm thi đấu</label>
      <div className="relative">
        <MapPin aria-hidden="true" className="absolute top-3.5 left-3 size-4 text-dp-meta" />
        <Input id={id} ref={input} role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open}
          aria-controls={open ? `${id}-options` : undefined} aria-activedescendant={open && selected >= 0 ? `${id}-option-${selected}` : undefined}
          placeholder="Nhập địa chỉ để tìm kiếm và định vị..." value={value.address} className="pl-10"
          onFocus={() => setOpen(true)} onChange={(event) => changeAddress(event.target.value)} onKeyDown={keyDown} />
        {open && <div className="dp-panel mt-2 max-h-60 overflow-y-auto shadow-xl">
          <ul id={`${id}-options`} role="listbox" aria-label="Gợi ý địa điểm">
            {options.map((place, index) => <li key={place.address} id={`${id}-option-${index}`} role="option" aria-selected={index === selected}
              onMouseDown={(event) => event.preventDefault()} onClick={() => choose(place)}
              className={cn("cursor-pointer border-b border-dp-hairline px-4 py-3 last:border-b-0 hover:bg-dp-bright/5", index === selected && "bg-dp-bright/5")}>
              <span className="block text-xs font-medium">{place.main}</span><span className="mt-1 block text-[11px] leading-5 text-dp-read">{place.sub}</span>
            </li>)}
          </ul>
          {!options.length && <p className="px-4 py-3 text-xs leading-5 text-dp-meta">{pending === "search" ? "Đang định vị và tìm gợi ý địa chỉ…" : "Không tìm thấy địa điểm phù hợp. Bạn vẫn có thể nhập trực tiếp địa chỉ."}</p>}
        </div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={Boolean(pending)} onClick={search}><Search />{pending === "search" ? "Đang tìm…" : "Tìm địa điểm"}</Button>
        <Button size="sm" variant="outline" disabled={Boolean(pending)} onClick={locate} title="Định vị vị trí hiện tại của tôi"><LocateFixed />{pending === "gps" ? "Đang định vị…" : "Định vị"}</Button>
      </div>
    </div>
    {error && <p role="alert" className="text-xs leading-6 text-red-400">{error}</p>}
    {notice && <p role="status" className="text-xs leading-6 text-dp-live">{notice}</p>}
    <p className="text-[10px] leading-5 text-dp-meta">Gợi ý nhanh từ danh sách địa điểm phổ biến. Bấm Tìm địa điểm để tra cứu thêm. Dữ liệu địa điểm © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap contributors</a>.</p>
    {previewQuery && <iframe title="Bản đồ địa điểm thi đấu" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
      src={`https://maps.google.com/maps?q=${encodeURIComponent(previewQuery)}&z=15&ie=UTF8&iwloc=&output=embed`}
      className="h-56 w-full rounded-panel border border-dp-hairline-2 bg-dp-ground" />}
  </div>;
}
