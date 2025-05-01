import datetime

import mysql.connector
import os
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS, cross_origin
import jwt
from flask import jsonify

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
publicKey = "AAAAC3NzaC1lZDI1NTE5AAAAIKH0xiAicRh3lsaO0QQ9keHNcYp82+PIFs745SYHifin"
app.config['SERVER_NAME'] = f'localhost:'
app.config['APPLICATION_ROOT'] = '/'
if __name__ == "__main__":
    app.run(port=3000, host='localhost', debug=True)

userList = [
    {
        'user_id': 1,
        'username': 'juliahusar',
        'password': 'juliahusar',
        'role': 'admin'
    }
]


def connect_to_db():
    try:
        db_connect = mysql.connector.connect(
            host=os.getenv("DIGITAL_OCEAN_HOST"),
            port=25060,
            user=os.getenv("USERNAME"),
            password=os.getenv("PASSWORD"),
            database=os.getenv("DATABASE")
        )
        print("Connected to db")
        return db_connect
    except mysql.connector.Error as err:
        print(f"Error: '{err}'")
        return None


@app.route('/')
@cross_origin()
def hello_world():
    return 'Hello World!'


@app.route('/api/login', methods=['GET', 'POST'])
@cross_origin()
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    print(username, password)
    if not data:
        return Response("No data provided", status=400)
    if not username or not password:
        return Response("Username and password are required", status=400)
    if not any(user['username'] == username and user['password'] == password for user in userList):
        return Response("Invalid username or password", status=401)
    for user in userList:
        if user['username'] == username and user['password'] == password:
            token = generate_jwt_token(username, password)
            return Response(token, status=200)


@app.route('/api/validate', methods=['GET', 'POST'])
@cross_origin()
def validate():
    token = request.headers.get('Authorization')
    if not token:
        return Response("No token provided", status=401)
    payload = validate_jwt(token)
    if not payload:
        return Response("Invalid token", status=401)
    return Response("Token is valid", status=200)


@app.route('/api/report', methods=['GET', 'POST'])
@cross_origin()
def get_report():
    # Get Co2 In/Out Over long period of time.
    # Aggregation can be added to make data more readable for frontend
    co2_in = get_data("co2-in")
    co2_out = get_data("co2-out")

    return jsonify({
        'co2_in': co2_in,
        'co2_out': co2_out
    })


@app.route('/api/summary', methods=['GET', 'POST'])
@cross_origin()
def get_summary():
    # Gets Lux In values for Summary
    lux_in = get_data("lux-in")
    biomass_data = get_biomass_data()
    return jsonify({'lux_in': lux_in, 'biomass_data': biomass_data})


def get_data(value_type):
    if value_type == "co2-in":
        schema_var = "co2-in"
    elif value_type == "co2-out":
        schema_var = "co2-out"
    else:
        schema_var = "lux-in"
    db_instance = connect_to_db()
    if db_instance is None:
        return {"error": "Database connection failed"}
    cursor = db_instance.cursor()
    cursor.execute(f"SELECT * FROM solardb.`{schema_var}`")
    columns = [column[0] for column in cursor.description]
    response = cursor.fetchall()
    sort_data = sorted(
        response,
        key=lambda x: datetime.datetime.strptime(x[0], "%m/%d/%Y %I:%M:%S %p")
    )
    mapped_data = [dict(zip(columns, row)) for row in sort_data]
    return mapped_data


def get_biomass_data():
    db_instance = connect_to_db()
    if db_instance is None:
        return {"error": "Database connection failed"}
    cursor = db_instance.cursor()
    cursor.execute("SELECT * FROM solardb.`biomass_g_l`")
    columns = [column[0] for column in cursor.description]
    response = cursor.fetchall()
    return response


def generate_jwt_token(username, password):
    payload = {
        'user_id': 1,
        'username': username,
        'password': password,
        'role': 'admin',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    }
    token = jwt.encode(payload, publicKey, algorithm='HS256')
    return token


def validate_jwt(token):
    try:
        payload = jwt.decode(token, publicKey, algorithms=['HS256'])
        print(payload)
        return payload
    except jwt.ExpiredSignatureError:
        print("Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        print("Invalid token. Access denied.")
    return None
