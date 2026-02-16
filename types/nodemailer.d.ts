declare module 'nodemailer' {
    const nodemailer: {
        createTransport: (config: any) => {
            sendMail: (options: any) => Promise<any>;
        };
    };
    export default nodemailer;
}
