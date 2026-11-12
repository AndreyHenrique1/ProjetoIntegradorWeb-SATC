import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "alfa-dev-secret-change-in-production";

export const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ mensagem: "Token de autenticação não informado." });
    }

    const token = auth.slice(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        return next();
    } catch {
        return res.status(401).json({ mensagem: "Token inválido ou expirado." });
    }
};