package handlers

import (
	"crypto/sha256"
	"encoding/binary"
	"gitkarma/be/db"
	log "gitkarma/be/logger"

	tbt "github.com/tigerbeetle/tigerbeetle-go/pkg/types"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

func Generate64BitID(username, password string) (uint64, error) {
	h := sha256.New()
	_, err := h.Write([]byte(username + ":" + password)) // Secure concatenation
	if err != nil {
		return 0, err
	}
	hashBytes := h.Sum(nil)
	id := binary.BigEndian.Uint64(hashBytes[:8])
	return id, nil
}

func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func CheckPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

// convertUint128ToUint64 extracts the lower 64 bits from a Uint128
func convertUint128ToUint64(u tbt.Uint128) uint64 {
	return binary.LittleEndian.Uint64(u[:])
}

// transformAccountToJson converts a TigerBeetle Account to an AccountDTO
func transformAccountToJson(account tbt.Account) AccountDTO {
	return AccountDTO{
		ID:             convertUint128ToUint64(account.ID),
		DebitsPending:  convertUint128ToUint64(account.DebitsPending),
		DebitsPosted:   convertUint128ToUint64(account.DebitsPosted),
		CreditsPending: convertUint128ToUint64(account.CreditsPending),
		CreditsPosted:  convertUint128ToUint64(account.CreditsPosted),
		UserData128:    convertUint128ToUint64(account.UserData128),
		UserData64:     account.UserData64,
		UserData32:     account.UserData32,
		Reserved:       uint64(account.Reserved),
		Ledger:         account.Ledger,
		Code:           uint32(account.Code),
		Flags:          uint32(account.Flags),
		Timestamp:      account.Timestamp,
	}
}

type UserDTO struct {
	Username string `json:"username" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AccountDTO struct {
	ID             uint64 `json:"ID"`
	DebitsPending  uint64 `json:"DebitsPending"`
	DebitsPosted   uint64 `json:"DebitsPosted"`
	CreditsPending uint64 `json:"CreditsPending"`
	CreditsPosted  uint64 `json:"CreditsPosted"`
	UserData128    uint64 `json:"UserData128"`
	UserData64     uint64 `json:"UserData64"`
	UserData32     uint32 `json:"UserData32"`
	Reserved       uint64 `json:"Reserved"`
	Ledger         uint32 `json:"Ledger"`
	Code           uint32 `json:"Code"`
	Flags          uint32 `json:"Flags"`
	Timestamp      uint64 `json:"Timestamp"`
}

type UserAccountDTO struct {
	User    db.User    `json:"user"`
	Account AccountDTO `json:"account"`
}

func users(r *gin.RouterGroup) {

	// create new user
	r.POST("/users", func(c *gin.Context) {
		var userDto UserDTO
		if err := c.BindJSON(&userDto); err != nil {
			log.Error("Error binding JSON:", zap.Error(err))
			c.JSON(400, gin.H{"error": "Invalid input"})
			return
		}

		// Generate a unique 64-bit ID
		id, err := Generate64BitID(userDto.Username, userDto.Password)
		if err != nil {
			log.Error("Error creating user id:", zap.Error(err))
			c.JSON(500, gin.H{"error": "Something went wrong generating id for user " + userDto.Username})
			return
		}
		userWithId := db.User{
			ID:       id,
			Email:    userDto.Email,
			Username: userDto.Username,
			Password: userDto.Password,
		}
		user := db.CreateUser(userWithId)
		if user.Error != nil {
			log.Error("Error creating user", zap.Error(user.Error))
			c.JSON(500, gin.H{"error": user.Error.Error()})
			return
		}
		account := db.CreateAccount(id)
		if account.Error != nil {
			log.Error("Error creating account", zap.Error(account.Error))
			c.JSON(500, gin.H{"error": account.Error.Error()})
			return
		}
		c.JSON(200, UserAccountDTO{
			User:    user.Data,
			Account: transformAccountToJson(account.Data),
		})
	})

	// get user
	r.GET("/users/:username", func(c *gin.Context) {
		username := c.Param("username")
		user := db.GetUser(username)
		if user.Error != nil {
			log.Error("Error getting user", zap.Error(user.Error))
			c.JSON(404, gin.H{"error": user.Error.Error()})
			return
		}
		account := db.GetAccountById(user.Data.ID)
		if account.Error != nil {
			log.Error("Error getting account", zap.Error(account.Error))
			c.JSON(404, gin.H{"error": account.Error.Error()})
			return
		}
		c.JSON(200, UserAccountDTO{
			User:    user.Data,
			Account: transformAccountToJson(account.Data),
		})
	})
}
