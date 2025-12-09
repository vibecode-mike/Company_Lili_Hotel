package routers

import (
	api "meta_page_backend/routers/api/v1"

	"github.com/gin-gonic/gin"
)

// InitUserRouter 開啟使用者相關的api
func InitUserRouter(r *gin.Engine) {

	apiv1 := r.Group("/api/v1")
	// user_auth := auth.UserAuth()

	// meta API
	{
		// webhook
		apiv1.GET("/meta_hook", api.MetaHook)
		apiv1.POST("/meta_hook", api.MetaHookPost)

		// ======= 粉絲專頁 API ==========
		// 取得所有貼文
		apiv1.GET("/meta_page/feed", api.GetMetaPageFeed)
		// 取得貼文留言
		apiv1.GET("/meta_page/comment", api.GetMetaPageComments)
		// 發布留言到指定貼文
		apiv1.POST("/meta_page/comment", api.PostMetaPageComment)
		// 刪除指定留言
		apiv1.DELETE("/meta_page/comment", api.DeleteMetaPageComment)
		// 主動發送訊息
		apiv1.POST("/meta_page/message", api.PostMetaMessage)

		// ======= 使用者資訊 ==========
		apiv1.GET("/meta_user/profile", api.GetMetaUserProfile)
	}
}
