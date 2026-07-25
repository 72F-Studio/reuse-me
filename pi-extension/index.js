export default function componentIntentAuditExtension(pi) {
  const sendAudit = (args, ctx) => {
    const tail = String(args || "").trim();
    const message = tail
      ? `/skill:component-intent-audit ${tail}`
      : "/skill:component-intent-audit";

    if (ctx?.isIdle?.() === false) {
      pi.sendUserMessage(message, { deliverAs: "followUp" });
      ctx?.ui?.notify?.("component-intent-audit queued as follow-up.", "info");
      return;
    }

    pi.sendUserMessage(message);
  };

  pi.registerCommand("component-intent-audit", {
    description: "Audit React/TypeScript shared-component drift",
    handler: sendAudit
  });
}
