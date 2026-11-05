"""Idempotent catalog seed: invented series, each with a run of episodes.

Video files are placeholders served from /api/media/sample/clip{1..3}.mp4 and
posters from /api/media/posters/<slug>.jpg. Swap them for licensed content.
"""
import uuid

FREE_EPISODES = 5
EPISODE_COST = 60
SAMPLE_CLIPS = 3

CATEGORIES = ["For You", "Romance", "Revenge", "CEO", "Werewolf", "Family"]

# slug, title, tagline, category, tags, episode count, synopsis
SERIES = [
    ("midnight-contract", "Midnight Contract", "Signed in secret. Broken in public.", "CEO",
     ["CEO", "Contract marriage"], 40,
     "A struggling designer signs a one-year marriage contract with a ruthless tycoon, and neither expects the terms to change."),
    ("the-last-heir", "The Last Heir", "Her family erased her. She came back.", "Revenge",
     ["Revenge", "Hidden identity"], 48,
     "Cast out as a child, an heiress returns under a new name to take back everything her relatives stole."),
    ("moon-bound", "Moon Bound", "Mated by fate. Hunted by choice.", "Werewolf",
     ["Werewolf", "Fated mates"], 36,
     "A human nurse is claimed by the alpha of a rival pack on the night of the blood moon."),
    ("second-chance-cafe", "Second Chance Cafe", "One coffee. One more try.", "Romance",
     ["Romance", "Second chance"], 30,
     "Ten years after a painful breakup, two exes end up running the same small-town cafe."),
    ("billionaires-nanny", "Billionaire's Nanny", "She came for the kids. Stayed for him.", "CEO",
     ["CEO", "Family"], 42,
     "A nanny with a secret past moves into a glass mansion and quietly rebuilds a broken family."),
    ("ashes-of-vengeance", "Ashes of Vengeance", "They burned her name. She burns theirs.", "Revenge",
     ["Revenge", "Thriller"], 45,
     "Framed and imprisoned, a former prosecutor walks free with a list and nothing left to lose."),
    ("alpha-and-the-omega", "Alpha and the Omega", "Rank is a cage. She picks the lock.", "Werewolf",
     ["Werewolf", "Forbidden love"], 38,
     "The pack's lowest-ranked wolf discovers she is the only one who can break an ancient curse."),
    ("home-for-the-holidays", "Home for the Holidays", "Three sisters. One house. Zero filters.", "Family",
     ["Family", "Comedy"], 28,
     "Three estranged sisters inherit their grandmother's house and a very specific list of rules."),
    ("love-in-translation", "Love in Translation", "Lost words. Found feelings.", "Romance",
     ["Romance", "Workplace"], 32,
     "An interpreter and a diplomat fall for each other through meetings neither can afford to get wrong."),
    ("mother-knows-best", "Mother Knows Best", "Nobody crosses her family twice.", "Family",
     ["Family", "Drama"], 34,
     "A quiet mother turns out to be the strategist her son's powerful in-laws should have feared."),
    ("the-ceos-secret-twin", "The CEO's Secret Twin", "Two brothers. One boardroom.", "CEO",
     ["CEO", "Twist"], 40,
     "When a CEO vanishes, his estranged twin steps into the role and into a marriage he never planned."),
    ("her-name-was-rose", "Her Name Was Rose", "The past knows where she lives.", "Revenge",
     ["Revenge", "Mystery"], 44,
     "A florist is recognised by a stranger as a woman who died ten years ago."),
]

# Trope/theme labels shown as chips (separate from the genre `category` and `tags`).
THEMES = {
    "midnight-contract": ["Betrayal", "Fake marriage"],
    "the-last-heir": ["Rebirth", "Hidden identity"],
    "moon-bound": ["Fated mates", "Rivals to lovers"],
    "second-chance-cafe": ["Reunion", "Second chance"],
    "billionaires-nanny": ["Hidden identity", "Found family"],
    "ashes-of-vengeance": ["Betrayal", "Comeback"],
    "alpha-and-the-omega": ["Forbidden love", "Rebirth"],
    "home-for-the-holidays": ["Reunion", "Found family"],
    "love-in-translation": ["Slow burn", "Enemies to lovers"],
    "mother-knows-best": ["Betrayal", "Family secrets"],
    "the-ceos-secret-twin": ["Identity swap", "Betrayal"],
    "her-name-was-rose": ["Rebirth", "Hidden past"],
}


def build_catalog():
    series_docs, episode_docs = [], []
    for idx, (slug, title, tagline, category, tags, count, synopsis) in enumerate(SERIES):
        sid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"series:{slug}"))
        series_docs.append({
            "id": sid,
            "slug": slug,
            "title": title,
            "tagline": tagline,
            "category": category,
            "tags": tags,
            "themes": THEMES[slug],
            "synopsis": synopsis,
            "poster_url": f"/api/media/posters/{slug}.jpg",
            "episode_count": count,
            "featured": idx < 5,
            "trending_rank": idx + 1,
            "released_order": len(SERIES) - idx,
        })
        for n in range(1, count + 1):
            episode_docs.append({
                "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"episode:{slug}:{n}")),
                "series_id": sid,
                "number": n,
                "title": f"Episode {n}",
                "video_url": f"/api/media/sample/clip{(n - 1) % SAMPLE_CLIPS + 1}.mp4",
                "duration": 90,
                "cost": 0 if n <= FREE_EPISODES else EPISODE_COST,
            })
    return series_docs, episode_docs


async def seed_if_empty(db):
    """Upsert series on every start (so new catalog fields reach existing databases);
    insert episodes only on first run so guest unlock state is never disturbed."""
    series_docs, episode_docs = build_catalog()
    for doc in series_docs:
        await db.series.update_one({"id": doc["id"]}, {"$set": doc}, upsert=True)
    if await db.episodes.count_documents({}) > 0:
        return False
    await db.episodes.insert_many(episode_docs)
    await db.episodes.create_index([("series_id", 1), ("number", 1)])
    return True
