# Dienst „updater“ (Issue #5) — führt Aktualisierungen aus, die Owner im Werkzeug anfordern.
# Hat als einziger Dienst Zugriff auf Docker (Socket) und das Repository; keinen offenen Port.
FROM docker:27-cli
RUN apk add --no-cache bash git curl jq openssl coreutils postgresql-client
WORKDIR /repo
# Das Skript kommt aus dem eingebundenen Repository und wird vor dem Start kopiert,
# damit ein Auschecken den laufenden Updater nicht verändert.
CMD ["bash", "-c", "cp /repo/deploy/updater/agent.sh /tmp/agent.sh && exec bash /tmp/agent.sh"]
