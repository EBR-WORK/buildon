import io

p = "src/components/admin/LeadsTable.tsx"
s = io.open(p, encoding="utf-8").read()

# --- state ---------------------------------------------------------------
old_state = '  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");'
new_state = '''  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  /* The row a notification pointed at.

     This was CSS alone — an id on the row and `tr:target` in globals.css —
     which works on a fresh page load and not at all here. Next navigates
     client-side, so by the time the URL carries #lead-42 the table is still
     loading and there is no such element: nothing to match, nothing to scroll
     to. The hash is read once the rows exist instead. */
  const [flash, setFlash] = useState<number | null>(null);'''
assert s.count(old_state) == 1, "status state"
s = s.replace(old_state, new_state)

# --- read the hash once the rows are there -------------------------------
old_eff = """  /* The place filter applies to everything below the cards"""
new_eff = """  useEffect(() => {
    if (status !== "ready") return;

    const id = Number(window.location.hash.match(/^#lead-(\\d+)$/)?.[1]);
    if (!Number.isFinite(id) || id === 0) return;

    /* A frame, so the row is painted before it is scrolled to. */
    const timer = window.setTimeout(() => {
      document
        .getElementById(`lead-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(id);
    }, 60);

    /* Cleared so the colour fades rather than marking the row for the rest of
       the session — the highlight answers "which one", and once the eye has
       found it a permanent colour reads as a status the row does not have. */
    const done = window.setTimeout(() => setFlash(null), 4000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(done);
    };
  }, [status]);

  /* The place filter applies to everything below the cards"""
assert s.count(old_eff) == 1, "effect anchor"
s = s.replace(old_eff, new_eff, 1)

# --- pass it to the row ---------------------------------------------------
old_prop = "                  mayEdit={mayAssign || lead.assigned_to === profile?.id}"
new_prop = "                  flash={flash === lead.id}\n" + old_prop
assert s.count(old_prop) == 1, "row prop"
s = s.replace(old_prop, new_prop)

s = s.replace("  mayEdit,\n  onEdit,", "  flash,\n  mayEdit,\n  onEdit,", 1)
s = s.replace("  mayEdit: boolean;\n  onEdit: () => void;",
              "  /** Lit because a notification pointed here. */\n  flash: boolean;\n  mayEdit: boolean;\n  onEdit: () => void;", 1)

# --- the row wears it -----------------------------------------------------
old_row = '''      <tr id={`lead-${lead.id}`} className={picked ? "bg-brand-50/40" : "hover:bg-surface/60"}>'''
new_row = '''      <tr
        id={`lead-${lead.id}`}
        className={
          flash
            ? "lead-found"
            : picked
              ? "bg-brand-50/40"
              : "hover:bg-surface/60"
        }
      >'''
assert s.count(old_row) == 1, "row markup"
s = s.replace(old_row, new_row)

io.open(p, "w", encoding="utf-8").write(s)
print("leads table highlights the row it was sent to")
