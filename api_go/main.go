package main

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"

	"gitkarma/be/db"
	app "gitkarma/be/handlers"
	log "gitkarma/be/logger"
	"gitkarma/be/transfers"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Load env variables
	// app
	appPort := os.Getenv("APP_PORT")
	// scylla db
	scylladbHostname := os.Getenv("SCYLLA_HOSTNAME")
	scylladbKeyspace := os.Getenv("SCYLLA_KEYSPACE")
	// tiger beetle
	tbPort := os.Getenv("TB_PORT")
	tbConcurrencyMaxStr := os.Getenv("TB_CONCURRENCY_MAX")
	tbConcurrencyMax, _ := strconv.ParseUint(tbConcurrencyMaxStr, 10, 64)

	// initiate tiger beetle
	transfers.TransfersConnect(tbPort, uint(tbConcurrencyMax))
	log.Info("Connected to Tiger Beetle.")
	db.DBConnect(scylladbHostname, scylladbKeyspace)
	log.Info("Connected to Scylla DB.")
	// storage.DBConnect(gocql.Quorum, "catalog", scylladbHostname)

	// start server
	r := app.NewApp()
	r.Run(":" + appPort)
}
