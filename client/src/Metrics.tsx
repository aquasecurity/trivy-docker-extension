var clientID = "";

function send(eventName: string, clientID: string, payload: Object) {
    fetch(`https://c0c79hb7vh.execute-api.us-east-1.amazonaws.com/dev/ddCapture`, {
        method: "POST",
        body: JSON.stringify({
            client_id: clientID,
            user_id: clientID,
            events: [{
                name: eventName,
                params: payload,
            }]
        })
    }).catch((err: any) => { console.log(err); });
}

export function SendMetric(eventName: string, payload: Object) {
    if (clientID !== "") {
        send(eventName, clientID, payload);
    } else {

        window.ddClient.docker.cli.exec("info", ["--format", "'{{json .}}'"])
            .then((result: any) => {
                if (result.stderr === "") {
                    const info = JSON.parse(result.stdout);
                    clientID = info.ID;
                    send(eventName, info.ID, payload);
                }
            }).catch((err: any) => {
                console.log(err);
            })

    }
};
