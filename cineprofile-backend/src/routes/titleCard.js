import express from "express";
const router = express.Router();

// GET /api/title/:id/card
router.get("/title/:id/card", async (req, res) => {
  const { id } = req.params;
  const key = process.env.TMDB_API_KEY; // varsa gerçek çağrı yaparız

  try {
    if (key) {
      const r = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${key}&language=en-US`
      );
      if (!r.ok) {
        return res.status(502).json({ error: `TMDB error ${r.status}` });
      }
      const j = await r.json();
      return res.json({
        id,
        poster: j.poster_path
          ? `https://image.tmdb.org/t/p/w500${j.poster_path}`
          : null,
        title: j.title ?? j.name ?? `Title #${id}`,
        overview: j.overview ?? "",
      });
    }

    // Anahtar yoksa mock döneriz (stub)
    return res.json({
      id,
      poster:
        "https://via.placeholder.com/300x450.png?text=Poster+Not+Available",
      title: `Title #${id}`,
      overview:
        "No TMDB_API_KEY provided. This is a stub response for UI development.",
    });
  } catch (e) {
    console.error("title/:id/card err:", e);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
