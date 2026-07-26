export default function componentIntentAuditExtension(pi) {
  const sendAudit = (args, ctx) => {
    const tail = String(args || "").trim();
    const message = tail
      ? `/skill:reuse-me ${tail}`
      : "/skill:reuse-me";

    if (ctx?.isIdle?.() === false) {
      pi.sendUserMessage(message, { deliverAs: "followUp" });
      ctx?.ui?.notify?.("reuse-me queued as follow-up.", "info");
      return;
    }

    pi.sendUserMessage(message);
  };

  pi.registerCommand("reuse-me", {
    description: "Audit React/TypeScript shared-component drift",
    handler: sendAudit
  });
}
