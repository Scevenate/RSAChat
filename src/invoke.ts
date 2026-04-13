

export const download = (side: "my" | "friend", seq: number) => {
    return () => {
        console.log(`Download ${side} ${seq}`)
    }
}

export const request = (side: "my" | "friend", seq: number) => {
    return () => {
        console.log(`Request ${side} ${seq}`)
    }
}