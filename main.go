```go
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)


// =========================================================
// MODELS
// =========================================================

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Username     string    `gorm:"uniqueIndex" json:"username"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"full_name"`
	Age          int       `json:"age"`
	Gender       string    `json:"gender"`
	CreatedAt    time.Time `json:"created_at"`
}

type Assessment struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	UserID             uint      `json:"user_id"`
	OverallScore       int       `json:"overall_score"`
	AccuracyPercent    int       `json:"accuracy_percent"`
	TotalErrors        int       `json:"total_errors"`
	CompletionTimeSec  float64   `json:"completion_time_sec"`
	AvgResponseTimeMs  float64   `json:"avg_response_time_ms"`
	DetailedStats      string    `json:"detailed_stats"`
	CreatedAt          time.Time `json:"created_at"`
}


// =========================================================
// GLOBAL VARIABLES
// =========================================================

var db *gorm.DB

var jwtSecret = []byte(getEnv("JWT_SECRET", "neurometric-secret"))


// =========================================================
// ENV HELPER
// =========================================================

func getEnv(key string, fallback string) string {

	value := os.Getenv(key)

	if value == "" {
		return fallback
	}

	return value
}


// =========================================================
// DATABASE INITIALIZATION
// =========================================================

func initDB() {

	if _, err := os.Stat("data"); os.IsNotExist(err) {
		os.Mkdir("data", 0755)
	}

	dbPath := getEnv("DB_PATH", "data/neurometric.db")

	var err error

	db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	db.AutoMigrate(
		&User{},
		&Assessment{},
	)

	log.Println("✓ Database initialized")
}


// =========================================================
// JWT TOKEN GENERATION
// =========================================================

func generateToken(userID uint) (string, error) {

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

	return token.SignedString(jwtSecret)
}


// =========================================================
// AUTH MIDDLEWARE
// =========================================================

func AuthMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {

		tokenString := c.GetHeader("Authorization")

		if tokenString == "" {

			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})

			c.Abort()
			return
		}

		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {

			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})

			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)

		if !ok {

			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token claims",
			})

			c.Abort()
			return
		}

		c.Set("user_id", uint(claims["user_id"].(float64)))

		c.Next()
	}
}


// =========================================================
// REGISTER HANDLER
// =========================================================

func register(c *gin.Context) {

	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		FullName string `json:"full_name"`
		Age      int    `json:"age"`
		Gender   string `json:"gender"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword(
		[]byte(input.Password),
		bcrypt.DefaultCost,
	)

	user := User{
		Username:     input.Username,
		PasswordHash: string(hashedPassword),
		FullName:     input.FullName,
		Age:          input.Age,
		Gender:       input.Gender,
	}

	if err := db.Create(&user).Error; err != nil {

		c.JSON(http.StatusConflict, gin.H{
			"error": "Username already exists",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Registration successful",
	})
}


// =========================================================
// LOGIN HANDLER
// =========================================================

func login(c *gin.Context) {

	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	var user User

	if err := db.Where("username = ?", input.Username).
		First(&user).Error; err != nil {

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})

		return
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(input.Password),
	); err != nil {

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid credentials",
		})

		return
	}

	token, err := generateToken(user.ID)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate token",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token": token,
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"full_name": user.FullName,
		},
	})
}


// =========================================================
// SUBMIT ASSESSMENT
// =========================================================

func submitAssessment(c *gin.Context) {

	userID := c.MustGet("user_id").(uint)

	var input struct {
		OverallScore      int     `json:"Overall_Score"`
		AccuracyPercent   int     `json:"Accuracy_Percent"`
		TotalErrors       int     `json:"Total_Errors"`
		CompletionTimeSec float64 `json:"Completion_Time_Sec"`
		AvgResponseTimeMs float64 `json:"Avg_Response_Time_Ms"`
		DetailedStats     string  `json:"detailed_stats"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid assessment payload",
		})

		return
	}

	assessment := Assessment{
		UserID:            userID,
		OverallScore:      input.OverallScore,
		AccuracyPercent:   input.AccuracyPercent,
		TotalErrors:       input.TotalErrors,
		CompletionTimeSec: input.CompletionTimeSec,
		AvgResponseTimeMs: input.AvgResponseTimeMs,
		DetailedStats:     input.DetailedStats,
	}

	if err := db.Create(&assessment).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to save assessment",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Assessment saved successfully",
		"id": assessment.ID,
	})
}


// =========================================================
// MAIN FUNCTION
// =========================================================

func main() {

	initDB()

	r := gin.Default()

	// =====================================================
	// CORS CONFIG
	// =====================================================

	r.Use(cors.Default())

	// =====================================================
	// API ROUTES
	// =====================================================

	api := r.Group("/api/v1")

	{
		auth := api.Group("/auth")

		{
			auth.POST("/register", register)
			auth.POST("/login", login)
		}

		protected := api.Group("/")

		protected.Use(AuthMiddleware())

		{
			protected.GET("/user/profile", func(c *gin.Context) {

				userID := c.MustGet("user_id").(uint)

				var user User

				db.First(&user, userID)

				c.JSON(http.StatusOK, user)
			})

			protected.POST("/assessments", submitAssessment)

			protected.GET("/assessments", func(c *gin.Context) {

				userID := c.MustGet("user_id").(uint)

				var assessments []Assessment

				db.Where("user_id = ?", userID).
					Order("created_at desc").
					Find(&assessments)

				c.JSON(http.StatusOK, assessments)
			})
		}
	}

	// =====================================================
	// STATIC FRONTEND FILES
	// =====================================================

	r.Static("/public", "./public")

	r.StaticFile("/", "./public/index.html")

	r.StaticFile("/dashboard", "./public/dashboard.html")

	r.StaticFile("/assessment", "./public/assessment.html")

	// =====================================================
	// FALLBACK STATIC FILES
	// =====================================================

	r.NoRoute(func(c *gin.Context) {

		path := c.Request.URL.Path

		c.File("./public" + path)
	})

	// =====================================================
	// START SERVER
	// =====================================================

	port := getEnv("PORT", "8080")

	log.Println("✓ NeuroMetric server running on port", port)

	r.Run(":" + port)
}
```
