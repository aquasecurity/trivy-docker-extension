
var clientID = "";

window.ddClient.docker.cli.exec("info", ["--format", "'{{json .}}'"])
    .then((result: any) => {
        if (result.stderr !== "") {
            clientID = result.ID;
        }
    });

export function Metric(eventName: string, payload: Object) {
    if (clientID === "") {
        return;
    }

    fetch(`https://c0c79hb7vh.execute-api.us-east-1.amazonaws.com/dev/ddCapture`, {
        method: "POST",
        body: JSON.stringify({
            client_id: clientID,
            events: [{
                name: eventName,
                params: payload,
            }]
        })
    }).catch(() => { });
};
