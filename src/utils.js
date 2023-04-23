const hostname = window.location.hostname
export const ws = new WebSocket(`ws://${hostname}:1890/ws`);
const timeout = 250;
export const connect = () => {
    let connectInterval;

    ws.onopen = () => {
        console.log("connected websocket main component");

        this.setState({ ws: ws });

        clearTimeout(connectInterval);
    };

    ws.onclose = e => {
        console.log(
            `Socket is closed. Reconnect will be attempted in ${Math.min(
                10000 / 1000,
                (timeout + timeout) / 1000
            )} second.`,
            e.reason
        );

        let retryTimeout = timeout + timeout;
        connectInterval = setTimeout(check, Math.min(10000, retryTimeout));
    };

    ws.onerror = err => {
        console.error(
            "Socket encountered error: ",
            err.message,
            "Closing socket"
        );

        ws.close();
    };
};

export const check = () => {
    if (!ws || ws.readyState === WebSocket.CLOSED) connect();
};

export const sendMessage = (data) => {
    try {
        ws.send(JSON.stringify(data))
    } catch (error) {
        console.log(error)
    }
}