FROM golang:1.25.4

COPY . $GOPATH/src/meta/

WORKDIR $GOPATH/src/meta/

RUN addgroup meta

RUN adduser admin

RUN chown -R admin:meta $GOPATH/src/meta/

USER admin

RUN go build -o meta

EXPOSE 11204

ENTRYPOINT [ "./meta" ]