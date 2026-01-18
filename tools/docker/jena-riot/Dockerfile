ARG JENA_VERSION=4.10.0
FROM eclipse-temurin:21-jre as base

ARG JENA_VERSION
ENV JENA_VERSION=${JENA_VERSION}
WORKDIR /opt

RUN set -euo pipefail \
 && apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates bash \
 && rm -rf /var/lib/apt/lists/* \
 && echo "Downloading Apache Jena ${JENA_VERSION} from archive.apache.org..." \
 && curl -fsSL "https://archive.apache.org/dist/jena/binaries/apache-jena-${JENA_VERSION}.tar.gz" -o jena.tgz \
 && mkdir -p /opt \
 && tar xzf jena.tgz \
 && rm jena.tgz

ENV PATH="/opt/apache-jena-${JENA_VERSION}/bin:${PATH}"
WORKDIR /work
ENTRYPOINT ["riot"]

