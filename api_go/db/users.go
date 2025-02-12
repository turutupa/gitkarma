package db

import (
	"fmt"
	log "gitkarma/be/logger"

	"github.com/gocql/gocql"
	"github.com/scylladb/gocqlx/qb"
	"go.uber.org/zap"
)

func CheckUserExists(username string) (bool, error) {
	tableName := ks + ".user"
	stmt, names := qb.Select(tableName).
		Columns("username").
		Where(qb.Eq("username")).
		ToCql()
	query := db.Query(stmt, names).BindMap(qb.M{"username": username})
	var existingUsername string
	if err := query.Scan(&existingUsername); err != nil {
		if err == gocql.ErrNotFound {
			return false, nil
		}
		return false, fmt.Errorf("failed to check if user exists: %w", err)
	}
	return true, nil
}

func CreateUser(user User) DBResponse[User] {
	exists, err := CheckUserExists(user.Username)
	if err != nil {
		return DBResponse[User]{Error: err}
	}
	if exists {
		return DBResponse[User]{Error: fmt.Errorf("user with username %s already exists", user.Username)}
	}
	tableName := ks + ".user"
	stmt, names := qb.Insert(tableName).
		Columns("username", "id", "email", "password").
		ToCql()
	query := db.Query(stmt, names).BindStruct(&user)
	if err := query.ExecRelease(); err != nil {
		return DBResponse[User]{Error: fmt.Errorf("failed to insert user: %w", err)}
	}
	return DBResponse[User]{
		Data:  user,
		Error: nil,
	}
}

func GetUser(username string) DBResponse[User] {
	stmt := fmt.Sprintf(`SELECT username, id, email, password FROM "%s"."user" WHERE username = ?`, ks)
	var user User
	query := db.Query(stmt, []string{"username"}).BindMap(map[string]interface{}{
		"username": username,
	})
	if err := query.GetRelease(&user); err != nil {
		if err == gocql.ErrNotFound {
			log.Error("User not found", zap.Error(err), zap.String("query", stmt))
			return DBResponse[User]{Error: fmt.Errorf("user %s not found", username)}
		} else {
			log.Error("Something went wrong", zap.Error(err), zap.String("query", stmt))
			return DBResponse[User]{Error: fmt.Errorf("failed to fetch user: %w", err)}
		}
	}
	return DBResponse[User]{
		Data:  user,
		Error: nil,
	}
}
