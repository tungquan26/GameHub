const videos = import.meta.glob("../assets/game-backgrounds/*.{mp4,webm}", {
  eager: true,
  query: "?url",
  import: "default",
});

export function gameBackgroundVideo(slug) {
  return videos[`../assets/game-backgrounds/${slug}.mp4`]
    || videos[`../assets/game-backgrounds/${slug}.webm`] || null;
}
