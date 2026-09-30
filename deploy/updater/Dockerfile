# Dienst „updater“ (Issue #5) — führt Aktualisierungen aus, die Owner im Werkzeug anfordern.
# Hat als einziger Dienst Zugriff auf Docker (Socket) und das Repository; keinen offenen Port.
FROM docker:27-cli
# optional: Zertifikat eines Firmen-Proxys (docker build --secret id=extra_ca,src=…), wie bei api und web
RUN --mount=type=secret,id=extra_ca,target=/tmp/extra-ca.crt,required=false \
    if [ -s /tmp/extra-ca.crt ]; then cat /etc/ssl/cert.pem /tmp/extra-ca.crt > /tmp/ca.pem; export SSL_CERT_FILE=/tmp/ca.pem; fi; \
    apk add --no-cache bash git curl jq openssl coreutils postgresql-client \
 && rm -f /tmp/ca.pem
WORKDIR /repo
# Das Skript kommt aus dem eingebundenen Repository und wird vor dem Start kopiert,
# damit ein Auschecken den laufenden Updater nicht verändert.
CMD ["bash", "-c", "cp /repo/deploy/updater/agent.sh /tmp/agent.sh && exec bash /tmp/agent.sh"]
