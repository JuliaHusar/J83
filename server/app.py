import datetime
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS, cross_origin
import jwt

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
publicKey = "AAAAC3NzaC1lZDI1NTE5AAAAIKH0xiAicRh3lsaO0QQ9keHNcYp82+PIFs745SYHifin"
app.port = 80
app.config['SERVER_NAME'] = f'localhost:'
app.config['APPLICATION_ROOT'] = '/'
app.run(port=3000, host='localhost', debug=True)

userList = [
    {
        'user_id': 1,
        'username': 'juliahusar',
        'password': 'juliahusar',
        'role': 'admin'
    }
]


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
