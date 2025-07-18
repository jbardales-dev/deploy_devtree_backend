import { Request, Response } from 'express'
import User from '../models/User'

export const followUser = async (req: Request, res: Response) => {
    const user = req.user!  // autenticado por el middleware
    const handle = req.params.handle

    try {
        const target = await User.findOne({ handle })

        if (!target) {
            return res.status(404).json({ error: 'Usuario objetivo no encontrado.' })
        }

        if (user._id.equals(target._id)) {
            return res.status(400).json({ error: 'No puedes seguirte a ti mismo.' })
        }

        const isFollowing = user.following.some(id => id.equals(target._id))

        if (isFollowing) {
            // Unfollow
            user.following = user.following.filter(id => !id.equals(target._id))
            target.followers = target.followers.filter(id => !id.equals(user._id))
            await user.save()
            await target.save()
            return res.json({ message: 'Usuario dejado de seguir.', isFollowing: false })
        } else {
            // Follow
            user.following.push(target._id)
            target.followers.push(user._id)
            await user.save()
            await target.save()
            return res.json({ message: 'Usuario seguido con éxito.', isFollowing: true })
        }

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Error al seguir o dejar de seguir al usuario.' })
    }
}


// Obtener a quién sigo
export const getFollowing = async (req: Request, res: Response) => {
    const userId = req.params.id
    const user = await User.findById(userId).populate('following', 'name handle')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user.following)
}

// Obtener mis seguidores
export const getFollowers = async (req: Request, res: Response) => {
    const userId = req.params.id
    const user = await User.findById(userId).populate('followers', 'name handle')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user.followers)
}

// Verifica si el usuario actual sigue al perfil del handle dado
export const isFollowing = async (req: Request, res: Response) => {
    const { currentUserId, handle } = req.params;

    try {
        // Buscar al usuario actual
        const user = await User.findById(currentUserId);
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        // Buscar al usuario objetivo por handle
        const targetUser = await User.findOne({ handle });
        if (!targetUser) return res.status(404).json({ message: "Usuario objetivo no encontrado" });

        // Verificar si el usuario actual lo sigue
        const isFollowing = user.following.some(followingId =>
            followingId.equals(targetUser._id)
        );

        res.json({ isFollowing });
    } catch (error) {
        console.error("Error en isFollowing:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
}

export const checkFollowStatus = async (req: Request, res: Response) => {
    try {
        const { followerId, handle } = req.query;

        // Verificación adicional de autenticación
        if (!req.user) {
            return res.status(401).json({ message: "No autorizado" });
        }

        if (!followerId || !handle) {
            return res.status(400).json({ message: "Se requieren followerId y handle" });
        }

        // Verificar que el followerId coincide con el usuario autenticado
        if (followerId !== req.user._id.toString()) {
            return res.status(403).json({ message: "No tienes permiso para esta acción" });
        }

        const targetUser = await User.findOne({ handle });
        if (!targetUser) {
            return res.status(404).json({ message: "Usuario objetivo no encontrado" });
        }

        const isFollowing = req.user.following.some(id =>
            id.equals(targetUser._id)
        );

        res.json({ isFollowing });
    } catch (error) {
        console.error("Error en checkFollowStatus:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
}
